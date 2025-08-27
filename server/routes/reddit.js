import express from 'express';
import { db } from '../database.js';
import { generateResponse, generateSubredditSuggestions } from '../services/aiService.js';
import { getRedditClient } from '../services/redditClient.js';
import { ragService } from '../services/ragService.js';

const router = express.Router();

// Get posts for a campaign
router.get('/posts/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { minRelevance = 30, subreddit, showAll = false } = req.query;
    
    let query = `
      SELECT p.*, 
             (SELECT content FROM responses WHERE post_id = p.id AND type = 'dm' LIMIT 1) as dm_content,
             (SELECT content FROM responses WHERE post_id = p.id AND type = 'comment' LIMIT 1) as comment_content,
             (SELECT COUNT(*) FROM starred_matches WHERE post_id = p.id) > 0 as is_starred
      FROM posts p 
      WHERE p.campaign_id = ?
    `;
    
    const params = [campaignId];
    
    // Only show relevant posts by default, unless showAll is true
    if (showAll !== 'true') {
      query += ' AND p.relevance_score >= ?';
      params.push(minRelevance);
    }
    
    if (subreddit) {
      query += ' AND p.subreddit = ?';
      params.push(subreddit);
    }
    
    query += ' ORDER BY p.relevance_score DESC, p.processed_at DESC';
    
    const posts = await db.allAsync(query, params);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Generate response for a post
router.post('/posts/:postId/response', async (req, res) => {
  try {
    const { postId } = req.params;
    const { type } = req.body; // 'dm' or 'comment'
    
    // Get post and campaign details
    const post = await db.getAsync(`
      SELECT p.*, c.product_name, c.description, c.website, c.dm_prompt 
      FROM posts p 
      JOIN campaigns c ON p.campaign_id = c.id 
      WHERE p.id = ?
    `, [postId]);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Get Reddit post details for AI generation
    const reddit = getRedditClient();
    const redditPost = await reddit.getSubmission(post.reddit_id);
    
    // Generate response using AI
    const content = await generateResponse(
      redditPost, 
      type, 
      post.dm_prompt, 
      post.product_name, 
      post.description, 
      post.website
    );
    
    // Save response to database
    await db.runAsync(
      'INSERT OR REPLACE INTO responses (post_id, type, content) VALUES (?, ?, ?)',
      [postId, type, content]
    );
    
    res.json({ content });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Star a post (add to RAG collection)
router.post('/posts/:postId/star', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Get post and campaign details
    const post = await db.getAsync(`
      SELECT p.*, c.id as campaign_id 
      FROM posts p 
      JOIN campaigns c ON p.campaign_id = c.id 
      WHERE p.id = ?
    `, [postId]);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if already starred
    const existingStarred = await db.getAsync(
      'SELECT id FROM starred_matches WHERE campaign_id = ? AND post_id = ?',
      [post.campaign_id, postId]
    );
    
    if (existingStarred) {
      return res.status(400).json({ error: 'Post already starred' });
    }
    
    // Add to RAG collection
    const ragResult = await ragService.addStarredMatch(post.campaign_id, post, postId);
    
    if (!ragResult.success) {
      console.error('Failed to add starred match to RAG:', ragResult.error);
      return res.status(500).json({ error: 'Failed to add to RAG collection' });
    }
    
    // Save to database
    await db.runAsync(
      'INSERT INTO starred_matches (campaign_id, post_id, rag_document_id) VALUES (?, ?, ?)',
      [post.campaign_id, postId, ragResult.documentId]
    );
    
    console.log(`⭐ Post ${postId} starred for campaign ${post.campaign_id}`);
    res.json({ success: true, message: 'Post starred successfully' });
    
  } catch (error) {
    console.error('Error starring post:', error);
    res.status(500).json({ error: 'Failed to star post' });
  }
});

// Unstar a post (remove from RAG collection)
router.delete('/posts/:postId/star', async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Get starred match details
    const starredMatch = await db.getAsync(
      'SELECT * FROM starred_matches WHERE post_id = ?',
      [postId]
    );
    
    if (!starredMatch) {
      return res.status(404).json({ error: 'Post not starred' });
    }
    
    // Remove from RAG collection
    const ragResult = await ragService.removeStarredMatch(
      starredMatch.campaign_id, 
      starredMatch.rag_document_id
    );
    
    if (!ragResult.success) {
      console.error('Failed to remove starred match from RAG:', ragResult.error);
      // Continue with database removal even if RAG fails
    }
    
    // Remove from database
    await db.runAsync('DELETE FROM starred_matches WHERE post_id = ?', [postId]);
    
    console.log(`⭐ Post ${postId} unstarred for campaign ${starredMatch.campaign_id}`);
    res.json({ success: true, message: 'Post unstarred successfully' });
    
  } catch (error) {
    console.error('Error unstarring post:', error);
    res.status(500).json({ error: 'Failed to unstar post' });
  }
});

// Get starred matches for a campaign
router.get('/campaigns/:campaignId/starred', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const starredMatches = await db.allAsync(`
      SELECT sm.*, p.title, p.content, p.author, p.subreddit, p.url, p.relevance_score, p.reddit_created_at
      FROM starred_matches sm
      JOIN posts p ON sm.post_id = p.id
      WHERE sm.campaign_id = ?
      ORDER BY sm.starred_at DESC
    `, [campaignId]);
    
    res.json(starredMatches);
  } catch (error) {
    console.error('Error fetching starred matches:', error);
    res.status(500).json({ error: 'Failed to fetch starred matches' });
  }
});

// Get subreddits for a campaign with enhanced statistics
router.get('/subreddits/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const subreddits = await db.allAsync(`
      SELECT 
        subreddit,
        COUNT(*) as post_count,
        COUNT(CASE WHEN relevance_score >= 30 THEN 1 END) as relevant_count,
        COUNT(CASE WHEN analysis_method = 'rag_filtered' THEN 1 END) as rag_filtered_count,
        COUNT(CASE WHEN analysis_method = 'rag_then_gpt' THEN 1 END) as rag_gpt_count,
        COUNT(CASE WHEN analysis_method = 'gpt_only' THEN 1 END) as gpt_only_count,
        AVG(relevance_score) as avg_relevance,
        MAX(relevance_score) as max_relevance,
        COUNT(CASE WHEN relevance_score >= 70 THEN 1 END) as high_relevance_count,
        MAX(processed_at) as last_processed
      FROM posts 
      WHERE campaign_id = ? 
      GROUP BY subreddit 
      ORDER BY post_count DESC
    `, [campaignId]);
    
    // Get campaign pagination info
    const campaign = await db.getAsync(`
      SELECT last_processed_post_fullname, updated_at 
      FROM campaigns 
      WHERE id = ?
    `, [campaignId]);
    
    res.json({
      subreddit_stats: subreddits,
      pagination_info: {
        last_processed_post: campaign?.last_processed_post_fullname || null,
        last_scan: campaign?.updated_at || null
      }
    });
  } catch (error) {
    console.error('Error fetching subreddits:', error);
    res.status(500).json({ error: 'Failed to fetch subreddits' });
  }
});

// Generate AI subreddit suggestions
router.post('/subreddit-suggestions', async (req, res) => {
  try {
    const { product_name, description } = req.body;
    
    if (!product_name || !description) {
      return res.status(400).json({ error: 'Product name and description are required' });
    }
    
    const suggestions = await generateSubredditSuggestions(product_name, description);
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Error generating subreddit suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Test Reddit connection
router.get('/test', async (req, res) => {
  try {
    const reddit = getRedditClient();
    const me = await reddit.getMe();
    res.json({ success: true, username: me.name });
  } catch (error) {
    console.error('Reddit test failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as redditRouter }; 
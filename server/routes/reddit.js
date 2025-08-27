import express from 'express';
import { db } from '../database.js';
import { generateResponse } from '../services/aiService.js';
import { getRedditClient } from '../services/redditClient.js';

const router = express.Router();

// Get posts for a campaign
router.get('/posts/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { minRelevance = 30, subreddit, showAll = false } = req.query;
    
    let query = `
      SELECT p.*, 
             (SELECT content FROM responses WHERE post_id = p.id AND type = 'dm' LIMIT 1) as dm_content,
             (SELECT content FROM responses WHERE post_id = p.id AND type = 'comment' LIMIT 1) as comment_content
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
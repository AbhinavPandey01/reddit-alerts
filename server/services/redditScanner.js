import cron from 'node-cron';
import { getRedditClient } from './redditClient.js';
import { analyzePostRelevance } from './aiService.js';
import { db } from '../database.js';

let isScanning = false;

export function startRedditScanner() {
  console.log('🔍 Starting Reddit scanner...');
  
  // Scan every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    if (isScanning) {
      console.log('⏳ Scanner already running, skipping...');
      return;
    }
    
    try {
      isScanning = true;
      await scanAllCampaigns();
    } catch (error) {
      console.error('❌ Scanner error:', error);
    } finally {
      isScanning = false;
    }
  });
  
  // Initial scan
  setTimeout(() => scanAllCampaigns(), 5000);
}

async function scanAllCampaigns() {
  try {
    const campaigns = await db.allAsync('SELECT * FROM campaigns');
    
    for (const campaign of campaigns) {
      await scanCampaign(campaign);
    }
    
    console.log(`✅ Scanned ${campaigns.length} campaigns`);
  } catch (error) {
    console.error('Error scanning campaigns:', error);
  }
}

async function scanCampaign(campaign) {
  try {
    const reddit = getRedditClient();
    const subreddits = JSON.parse(campaign.subreddits);
    
    console.log(`🔍 Scanning campaign: ${campaign.product_name}`);
    
    for (const subredditName of subreddits) {
      try {
        const subreddit = await reddit.getSubreddit(subredditName);
        const posts = await subreddit.getNew({ limit: 25 });
        
        let newPostsCount = 0;
        
        for (const post of posts) {
          // Skip if post already exists
          const existingPost = await db.getAsync(
            'SELECT id FROM posts WHERE reddit_id = ?', 
            [post.id]
          );
          
          if (existingPost) continue;
          
          // Analyze relevance with AI
          const relevanceScore = await analyzePostRelevance(
            post, 
            campaign.search_prompt, 
            campaign.description
          );
          
          // Only save posts with relevance > 30
          if (relevanceScore > 30) {
            await db.runAsync(`
              INSERT INTO posts (
                campaign_id, reddit_id, title, content, author, subreddit, 
                url, relevance_score, reddit_created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              campaign.id,
              post.id,
              post.title,
              post.selftext || '',
              post.author.name,
              post.subreddit.display_name,
              `https://reddit.com${post.permalink}`,
              relevanceScore,
              new Date(post.created_utc * 1000).toISOString()
            ]);
            
            newPostsCount++;
          }
        }
        
        if (newPostsCount > 0) {
          console.log(`  📝 Found ${newPostsCount} new posts in r/${subredditName}`);
        }
        
      } catch (error) {
        console.error(`Error scanning r/${subredditName}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`Error scanning campaign ${campaign.id}:`, error);
  }
}

export async function scanCampaignNow(campaignId) {
  try {
    const campaign = await db.getAsync('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
    if (campaign) {
      await scanCampaign(campaign);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in manual scan:', error);
    return false;
  }
} 
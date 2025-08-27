import cron from 'node-cron';
import { getRedditClient } from './redditClient.js';
import { analyzePostRelevanceWithRAG, analyzePostRelevance } from './aiService.js';
import { ragService } from './ragService.js';
import { db } from '../database.js';

let isScanning = false;

export function startRedditScanner() {
  console.log('🔍 Starting Reddit scanner with RAG filtering...');
  
  // Check RAG service health on startup
  ragService.healthCheck().then(health => {
    if (health.available) {
      console.log('✅ RAG service is available');
    } else {
      console.log('⚠️ RAG service unavailable, will use GPT-4o only mode');
    }
  });
  
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
    
    // Check if RAG service is available
    const useRAG = false;
    
    if (!useRAG) {
      console.log(`⚠️ RAG service unavailable for campaign ${campaign.id}, using GPT-4o only`);
    }
    
    let campaignNewestPostFullname = null; // Track newest post across all subreddits
    
    for (const subredditName of subreddits) {
      try {
        const subreddit = await reddit.getSubreddit(subredditName);
        
        // Use pagination to get only new posts since last scan
        const fetchOptions = { limit: 25 };
        if (campaign.last_processed_post_fullname) {
          fetchOptions.after = campaign.last_processed_post_fullname;
          console.log(`📄 Using pagination: after ${campaign.last_processed_post_fullname}`);
        } else {
          console.log(`📄 First scan for campaign ${campaign.id}, getting latest posts`);
        }
        
        const posts = await subreddit.getNew(fetchOptions);
        
        let newPostsCount = 0;
        let ragFilteredCount = 0;
        let gptAnalyzedCount = 0;
        let processedPostsCount = 0;
        
        console.log(`📊 Retrieved ${posts.length} posts from r/${subredditName}`);
        
        for (const post of posts) {
          // Track the newest post fullname (first post is newest)
          if (!campaignNewestPostFullname) {
            campaignNewestPostFullname = post.name; // post.name is the fullname (t3_xxxxx)
          }
          
          let analysisResult;
          
          if (useRAG) {
            analysisResult = await analyzePostRelevanceWithRAG(post, campaign, 0.6);
          } else {
            const score = await analyzePostRelevance(post, campaign.search_prompt, campaign.description);
            analysisResult = { score: score, method: 'gpt_only' };
          }
          
          const relevanceScore = analysisResult.score;
          processedPostsCount++;
          
          // Save ALL processed posts (even filtered ones) to prevent reprocessing
          await db.runAsync(`
            INSERT OR IGNORE INTO posts (
              campaign_id, reddit_id, title, content, author, subreddit, 
              url, relevance_score, reddit_created_at, analysis_method, rag_score, processed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            campaign.id,
            post.id,
            post.title,
            post.selftext || '',
            post.author.name,
            post.subreddit.display_name,
            `https://reddit.com${post.permalink}`,
            relevanceScore,
            new Date(post.created_utc * 1000).toISOString(),
            analysisResult.method || 'unknown',
            analysisResult.ragScore || null
          ]);
          
          if (relevanceScore > 30) {
            newPostsCount++;
            console.log(`✅ Saved relevant post ${post.id} (score: ${relevanceScore}, method: ${analysisResult.method})`);
          } else {
            console.log(`📝 Saved filtered post ${post.id} (score: ${relevanceScore}, method: ${analysisResult.method})`);
          }
        }
        
        if (processedPostsCount > 0) {
          console.log(`  📊 r/${subredditName}: ${processedPostsCount} processed, ${newPostsCount} relevant, ${ragFilteredCount} RAG filtered, ${gptAnalyzedCount} GPT analyzed`);
        } else {
          console.log(`  📊 r/${subredditName}: No new posts since last scan`);
        }
        
      } catch (error) {
        console.error(`Error scanning r/${subredditName}:`, error.message);
      }
    }
    
    // Update campaign's last processed post fullname for next scan
    if (campaignNewestPostFullname) {
      await db.runAsync(
        'UPDATE campaigns SET last_processed_post_fullname = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [campaignNewestPostFullname, campaign.id]
      );
      console.log(`📌 Updated last processed post for campaign ${campaign.id}: ${campaignNewestPostFullname}`);
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
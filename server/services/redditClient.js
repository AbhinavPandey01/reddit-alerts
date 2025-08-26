import snoowrap from 'snoowrap';
import dotenv from 'dotenv';

dotenv.config();

let redditClient = null;

export function getRedditClient() {
  if (!redditClient) {
    redditClient = new snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT || 'reddit-alerts-bot/1.0',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN
    });
  }
  return redditClient;
}

export async function testRedditConnection() {
  try {
    const reddit = getRedditClient();
    const me = await reddit.getMe();
    console.log('✅ Reddit API connected successfully as:', me.name);
    return true;
  } catch (error) {
    console.error('❌ Reddit API connection failed:', error.message);
    return false;
  }
} 
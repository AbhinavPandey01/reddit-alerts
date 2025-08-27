import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./reddit_alerts.db');

// Custom promisified run method that returns the context with lastID
db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

// Promisify other database methods
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));

export async function initDatabase() {
  try {
    // Campaigns table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        description TEXT NOT NULL,
        subreddits TEXT NOT NULL,
        search_prompt TEXT DEFAULT 'Find posts where I can promote my product and find posts that are explicitly asking for advice where my product can directly address the request.',
        dm_prompt TEXT DEFAULT 'Write a DM promoting my product. Hi [recipient_first_name], I''m from [product_name]. I saw your post about [post_reference]. [product_description] Check it out: [website]',
        website TEXT,
        last_processed_post_fullname TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Posts table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER,
        reddit_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        author TEXT NOT NULL,
        subreddit TEXT NOT NULL,
        url TEXT NOT NULL,
        relevance_score INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reddit_created_at DATETIME,
        analysis_method TEXT DEFAULT 'gpt_only',
        rag_score REAL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
      )
    `);

    // Add new columns to existing tables if they don't exist
    // Check and add columns one by one with better error handling
    
    // Check if processed_at column exists
    const columns = await db.allAsync(`PRAGMA table_info(posts)`);
    const hasProcessedAt = columns.some(col => col.name === 'processed_at');
    
    if (!hasProcessedAt) {
      try {
        await db.runAsync(`ALTER TABLE posts ADD COLUMN processed_at DATETIME`);
        await db.runAsync(`UPDATE posts SET processed_at = CURRENT_TIMESTAMP WHERE processed_at IS NULL`);
        console.log('✅ Added processed_at column to posts table');
      } catch (error) {
        console.error('❌ Failed to add processed_at column:', error.message);
      }
    }
    
    // Check other columns
    const hasAnalysisMethod = columns.some(col => col.name === 'analysis_method');
    const hasRagScore = columns.some(col => col.name === 'rag_score');
    
    if (!hasAnalysisMethod) {
      try {
        await db.runAsync(`ALTER TABLE posts ADD COLUMN analysis_method TEXT DEFAULT 'gpt_only'`);
        console.log('✅ Added analysis_method column to posts table');
      } catch (error) {
        console.error('❌ Failed to add analysis_method column:', error.message);
      }
    }
    
    if (!hasRagScore) {
      try {
        await db.runAsync(`ALTER TABLE posts ADD COLUMN rag_score REAL`);
        console.log('✅ Added rag_score column to posts table');
      } catch (error) {
        console.error('❌ Failed to add rag_score column:', error.message);
      }
    }
    
    // Check campaigns table
    const campaignColumns = await db.allAsync(`PRAGMA table_info(campaigns)`);
    const hasLastProcessed = campaignColumns.some(col => col.name === 'last_processed_post_fullname');
    
    if (!hasLastProcessed) {
      try {
        await db.runAsync(`ALTER TABLE campaigns ADD COLUMN last_processed_post_fullname TEXT`);
        console.log('✅ Added last_processed_post_fullname column to campaigns table');
      } catch (error) {
        console.error('❌ Failed to add last_processed_post_fullname column:', error.message);
      }
    }

    // Generated responses table
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        type TEXT NOT NULL CHECK (type IN ('comment', 'dm')),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts (id)
      )
    `);

    // Starred matches table for RAG learning
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS starred_matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        rag_document_id TEXT NOT NULL,
        starred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id),
        FOREIGN KEY (post_id) REFERENCES posts (id),
        UNIQUE(campaign_id, post_id)
      )
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export { db }; 
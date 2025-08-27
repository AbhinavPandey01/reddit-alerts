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
    try {
      await db.runAsync(`ALTER TABLE campaigns ADD COLUMN last_processed_post_fullname TEXT`);
    } catch (error) {
      // Column already exists, ignore
    }
    
    try {
      await db.runAsync(`ALTER TABLE posts ADD COLUMN analysis_method TEXT DEFAULT 'gpt_only'`);
    } catch (error) {
      // Column already exists, ignore
    }
    
    try {
      await db.runAsync(`ALTER TABLE posts ADD COLUMN rag_score REAL`);
    } catch (error) {
      // Column already exists, ignore
    }
    
    try {
      await db.runAsync(`ALTER TABLE posts ADD COLUMN processed_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
    } catch (error) {
      // Column already exists, ignore
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

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export { db }; 
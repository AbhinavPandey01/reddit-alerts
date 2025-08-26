import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';
import { redditRouter } from './routes/reddit.js';
import { campaignRouter } from './routes/campaigns.js';
import { startRedditScanner } from './services/redditScanner.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
await initDatabase();

// API Routes
app.use('/api/reddit', redditRouter);
app.use('/api/campaigns', campaignRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Reddit Alerts API is running' });
});

// Start Reddit scanner
startRedditScanner();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
}); 
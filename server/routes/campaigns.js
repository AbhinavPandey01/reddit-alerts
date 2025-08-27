import express from 'express';
import { db } from '../database.js';
import { ragService } from '../services/ragService.js';

const router = express.Router();

// Create campaign
router.post('/', async (req, res) => {
  try {
    const { product_name, description, subreddits, website, search_prompt, dm_prompt } = req.body;
    
    const result = await db.runAsync(
      `INSERT INTO campaigns (product_name, description, subreddits, website, search_prompt, dm_prompt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product_name, description, JSON.stringify(subreddits), website, search_prompt, dm_prompt]
    );

    const campaign = await db.getAsync('SELECT * FROM campaigns WHERE id = ?', [result.lastID]);
    
    // Initialize RAG knowledge base for the new campaign
    try {
      console.log(`🔍 Initializing RAG knowledge base for campaign ${campaign.id}`);
      await ragService.initializeCampaignKnowledge(
        campaign.id, 
        search_prompt || campaign.search_prompt, 
        description
      );
      console.log(`✅ RAG knowledge base initialized for campaign ${campaign.id}`);
    } catch (ragError) {
      console.warn(`⚠️ Failed to initialize RAG for campaign ${campaign.id}:`, ragError.message);
      // Don't fail campaign creation if RAG initialization fails
    }
    
    res.json({
      ...campaign,
      subreddits: JSON.parse(campaign.subreddits)
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await db.allAsync('SELECT * FROM campaigns ORDER BY created_at DESC');
    res.json(campaigns.map(campaign => ({
      ...campaign,
      subreddits: JSON.parse(campaign.subreddits)
    })));
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await db.getAsync('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({
      ...campaign,
      subreddits: JSON.parse(campaign.subreddits)
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { product_name, description, subreddits, website, search_prompt, dm_prompt } = req.body;
    
    await db.runAsync(
      `UPDATE campaigns SET 
       product_name = ?, description = ?, subreddits = ?, website = ?, 
       search_prompt = ?, dm_prompt = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [product_name, description, JSON.stringify(subreddits), website, search_prompt, dm_prompt, req.params.id]
    );

    const campaign = await db.getAsync('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    res.json({
      ...campaign,
      subreddits: JSON.parse(campaign.subreddits)
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    // Clean up RAG knowledge base
    try {
      console.log(`🗑️ Cleaning up RAG knowledge base for campaign ${campaignId}`);
      await ragService.cleanupCampaign(campaignId);
      console.log(`✅ RAG knowledge base cleaned up for campaign ${campaignId}`);
    } catch (ragError) {
      console.warn(`⚠️ Failed to cleanup RAG for campaign ${campaignId}:`, ragError.message);
      // Don't fail campaign deletion if RAG cleanup fails
    }
    
    // Delete campaign and related data
    await db.runAsync('DELETE FROM responses WHERE post_id IN (SELECT id FROM posts WHERE campaign_id = ?)', [campaignId]);
    await db.runAsync('DELETE FROM posts WHERE campaign_id = ?', [campaignId]);
    await db.runAsync('DELETE FROM campaigns WHERE id = ?', [campaignId]);
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export { router as campaignRouter }; 
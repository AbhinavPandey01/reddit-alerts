import express from 'express';
import { db } from '../database.js';

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
    res.json(campaign);
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
    await db.runAsync('DELETE FROM campaigns WHERE id = ?', [req.params.id]);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export { router as campaignRouter }; 
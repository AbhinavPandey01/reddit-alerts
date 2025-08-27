import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:5000';
const RAG_TIMEOUT = 5000; // 5 second timeout

class RAGService {
  constructor() {
    this.baseUrl = RAG_API_URL;
  }

  /**
   * Embed a Reddit post document for similarity matching
   * @param {string} campaignId - Campaign identifier for collection naming
   * @param {Object} post - Reddit post object
   * @param {string} searchCriteria - Campaign search criteria for context
   * @returns {Promise<{success: boolean, documentId?: string, error?: string}>}
   */
  async embedPost(campaignId, post, searchCriteria) {
    try {
      const collectionName = `campaign_${campaignId}`;
      const documentId = `post_${post.id}_${Date.now()}`; // Unique ID with timestamp
      
      // Create document content combining post data with search context
      const documentContent = `
SEARCH CRITERIA: ${searchCriteria}

POST TITLE: ${post.title}
POST CONTENT: ${post.selftext || 'No content'}
SUBREDDIT: ${post.subreddit.display_name}
AUTHOR: ${post.author.name}
      `.trim();

      const embedRequest = {
        collection_name: collectionName,
        document: {
          id: documentId,
          content: documentContent,
          metadata: {
            reddit_id: post.id,
            title: post.title,
            subreddit: post.subreddit.display_name,
            author: post.author.name,
            created_utc: post.created_utc,
            campaign_id: campaignId
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(embedRequest),
        timeout: RAG_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`RAG embed failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return { success: true, documentId };
      } else {
        return { success: false, error: result.message || 'Unknown embed error' };
      }
    } catch (error) {
      console.error('RAG embed error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Query for similar posts and filter by threshold
   * @param {string} campaignId - Campaign identifier
   * @param {Object} post - Reddit post to match against
   * @param {string} searchCriteria - Campaign search criteria
   * @param {number} threshold - Similarity threshold (0.0-1.0)
   * @param {number} topK - Maximum results to return
   * @returns {Promise<{success: boolean, shouldProcess: boolean, similarity?: number, error?: string}>}
   */
  async queryAndFilter(campaignId, post, searchCriteria, threshold = 0.6, topK = 5) {
    try {
      const collectionName = `campaign_${campaignId}`;
      
      // Create query content similar to embed format
      const queryContent = `
SEARCH CRITERIA: ${searchCriteria}

POST TITLE: ${post.title}
POST CONTENT: ${post.selftext || 'No content'}
SUBREDDIT: ${post.subreddit.display_name}
      `.trim();

      const queryRequest = {
        collection_name: collectionName,
        query: queryContent,
        top_k: topK,
        min_score: 0.0 // We'll filter ourselves
      };

      const response = await fetch(`${this.baseUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(queryRequest),
        timeout: RAG_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`RAG query failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.results.length > 0) {
        // Get the highest similarity score
        const maxSimilarity = Math.max(...result.results.map(r => r.score));
        const shouldProcess = maxSimilarity >= threshold;
        
        return { 
          success: true, 
          shouldProcess, 
          similarity: maxSimilarity,
          matchCount: result.results.length
        };
      } else {
        // No existing similar posts, should process (new type of post)
        return { 
          success: true, 
          shouldProcess: true, 
          similarity: 0,
          matchCount: 0
        };
      }
    } catch (error) {
      console.error('RAG query error:', error);
      // On error, default to processing the post (fail-safe)
      return { success: false, shouldProcess: true, error: error.message };
    }
  }

  /**
   * Delete a document from RAG storage
   * @param {string} campaignId - Campaign identifier
   * @param {string} documentId - Document ID to delete
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteDocument(campaignId, documentId) {
    try {
      const collectionName = `campaign_${campaignId}`;
      
      const deleteRequest = {
        collection_name: collectionName,
        document_id: documentId
      };

      const response = await fetch(`${this.baseUrl}/api/document`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteRequest),
        timeout: RAG_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`RAG delete failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: result.success, error: result.message };
    } catch (error) {
      console.error('RAG delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize campaign collection with seed document
   * @param {string} campaignId - Campaign identifier
   * @param {string} productDescription - Product description
   * @param {string} searchCriteria - Campaign search criteria
   * @returns {Promise<{success: boolean, seedDocumentId?: string, error?: string}>}
   */
  async initializeCampaignWithSeed(campaignId, productDescription, searchCriteria) {
    try {
      const collectionName = `campaign_${campaignId}`;
      const seedDocumentId = `seed_${campaignId}`;
      
      // Create comprehensive seed document
      const seedContent = `
PRODUCT: ${productDescription}

INTENT QUERY: Which are matching posts in which the person is actively or passively looking for this solution, or depicts a positive intent for the product?

IDEAL POST CHARACTERISTICS:
- Shows explicit need for the solution
- Asks for recommendations in relevant products  
- Expresses frustration with current alternatives
- Demonstrates buying intent or evaluation phase

SEARCH CRITERIA: ${searchCriteria}
      `.trim();

      const embedRequest = {
        collection_name: collectionName,
        document: {
          id: seedDocumentId,
          content: seedContent,
          metadata: {
            type: 'seed_document',
            campaign_id: campaignId,
            product_description: productDescription,
            search_criteria: searchCriteria,
            created_at: new Date().toISOString()
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(embedRequest),
        timeout: RAG_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`RAG seed initialization failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return { success: true, seedDocumentId };
      } else {
        return { success: false, error: result.message || 'Unknown seed initialization error' };
      }
    } catch (error) {
      console.error('RAG seed initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Query posts against collection (seed document only)
   * @param {string} campaignId - Campaign identifier
   * @param {Object} post - Reddit post to match against
   * @param {number} threshold - Similarity threshold (0.0-1.0)
   * @param {number} topK - Maximum results to return
   * @returns {Promise<{success: boolean, shouldProcess: boolean, similarity?: number}>}
   */
  async queryForMatching(campaignId, post, threshold = 0.6, topK = 10) {
    try {
      const collectionName = `campaign_${campaignId}`;
      
      const queryContent = `
POST TITLE: ${post.title}
POST CONTENT: ${post.selftext || 'No content'}
AUTHOR: ${post.author.name || post.author}
      `.trim();

      const queryRequest = {
        collection_name: collectionName,
        query: queryContent,
        top_k: topK,
        min_score: 0.0
      };

      const response = await fetch(`${this.baseUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryRequest),
        timeout: RAG_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`RAG query failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.results.length > 0) {
        // Check similarity against seed document only
        const maxSimilarity = Math.max(...result.results.map(r => r.score));
        return { 
          success: true, 
          shouldProcess: maxSimilarity >= threshold,
          similarity: maxSimilarity
        };
      }
      
      // No documents in collection - don't process
      return { success: true, shouldProcess: false, similarity: 0 };
      
    } catch (error) {
      console.error('RAG query error:', error);
      return { success: false, shouldProcess: false, error: error.message };
    }
  }

  /**
   * Clean up campaign collection
   * @param {string} campaignId - Campaign identifier
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async cleanupCampaign(campaignId) {
    try {
      const collectionName = `campaign_${campaignId}`;
      
      const deleteRequest = {
        collection_name: collectionName
      };

      const response = await fetch(`${this.baseUrl}/api/collection`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteRequest),
        timeout: RAG_TIMEOUT
      });

      if (!response.ok) {
        throw new Error(`RAG cleanup failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return { success: result.success, error: result.message };
    } catch (error) {
      console.error('RAG cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Health check for RAG service
   * @returns {Promise<{available: boolean, error?: string}>}
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: RAG_TIMEOUT
      });

      if (response.ok) {
        const result = await response.json();
        return { available: true, status: result.status };
      } else {
        return { available: false, error: `Health check failed: ${response.status}` };
      }
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
}

// Export singleton instance
export const ragService = new RAGService();
export default ragService; 
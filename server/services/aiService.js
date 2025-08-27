import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ragService } from './ragService.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze post relevance with RAG pre-filtering pipeline
 * @param {Object} post - Reddit post object
 * @param {Object} campaign - Campaign object with search_prompt, description, etc.
 * @param {number} ragThreshold - RAG similarity threshold (default 0.6)
 * @returns {Promise<{score: number, method: string, ragScore?: number, ragDocumentId?: string}>}
 */
export async function analyzePostRelevanceWithRAG(post, campaign, ragThreshold = 0.6) {
  let ragDocumentId = null;
  
  try {
    // Step 1: Embed the post in RAG for similarity matching
    console.log(`🔍 RAG: Embedding post ${post.id} for campaign ${campaign.id}`);
    const embedResult = await ragService.embedPost(campaign.id, post, campaign.search_prompt);
    
    if (!embedResult.success) {
      console.log(`⚠️ RAG embed failed, falling back to GPT-4o: ${embedResult.error}`);
      return await analyzePostRelevanceGPT(post, campaign.search_prompt, campaign.description);
    }
    
    ragDocumentId = embedResult.documentId;
    
    // Step 2: Query for similar posts and filter by threshold
    console.log(`🔍 RAG: Querying similarity for post ${post.id}`);
    const queryResult = await ragService.queryAndFilter(
      campaign.id, 
      post, 
      campaign.search_prompt, 
      ragThreshold
    );
    
    if (!queryResult.success) {
      console.log(`⚠️ RAG query failed, falling back to GPT-4o: ${queryResult.error}`);
      // Clean up the embedded document
      if (ragDocumentId) {
        await ragService.deleteDocument(campaign.id, ragDocumentId);
      }
      return await analyzePostRelevanceGPT(post, campaign.search_prompt, campaign.description);
    }
    
    // Step 3: Check if post passes RAG filter
    if (!queryResult.shouldProcess) {
      console.log(`🚫 RAG: Post ${post.id} filtered out (similarity: ${queryResult.similarity?.toFixed(3)}, threshold: ${ragThreshold})`);
      
      // Step 4: Delete document from RAG (no longer needed)
      await ragService.deleteDocument(campaign.id, ragDocumentId);
      
      return {
        score: 0,
        method: 'rag_filtered',
        ragScore: queryResult.similarity,
        ragMatchCount: queryResult.matchCount
      };
    }
    
    // Step 4: Post passes RAG filter, analyze with GPT-4o
    console.log(`✅ RAG: Post ${post.id} passed filter (similarity: ${queryResult.similarity?.toFixed(3)}), analyzing with GPT-4o`);
    const gptResult = await analyzePostRelevanceGPT(post, campaign.search_prompt, campaign.description);
    
    // Step 5: Delete document from RAG (no longer needed)
    await ragService.deleteDocument(campaign.id, ragDocumentId);
    
    return {
      score: gptResult.score,
      method: 'rag_then_gpt',
      ragScore: queryResult.similarity,
      ragMatchCount: queryResult.matchCount,
      gptScore: gptResult.score
    };
    
  } catch (error) {
    console.error('Error in RAG pipeline:', error);
    
    // Clean up on error
    if (ragDocumentId) {
      await ragService.deleteDocument(campaign.id, ragDocumentId);
    }
    
    // Fallback to GPT-4o only
    const fallbackResult = await analyzePostRelevanceGPT(post, campaign.search_prompt, campaign.description);
    return {
      score: fallbackResult.score,
      method: 'gpt_fallback',
      error: error.message
    };
  }
}

/**
 * Original GPT-4o analysis function (now used as fallback or final stage)
 * @param {Object} post - Reddit post object
 * @param {string} searchPrompt - Search criteria
 * @param {string} productDescription - Product description
 * @returns {Promise<{score: number, method: string}>}
 */
export async function analyzePostRelevanceGPT(post, searchPrompt, productDescription) {
  try {
    const prompt = `
You are analyzing Reddit posts to find potential leads for a product.

SEARCH CRITERIA: ${searchPrompt}

PRODUCT: ${productDescription}

POST TO ANALYZE:
Title: ${post.title}
Content: ${post.selftext || 'No content'}
Subreddit: ${post.subreddit.display_name}

Rate this post's relevance from 0-100 based on:
1. How well it matches the search criteria
2. Whether the user seems to need this product
3. If it's appropriate to reach out to this user

Respond with ONLY a number from 0-100.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0.3,
    });

    const score = parseInt(response.choices[0].message.content.trim());
    return {
      score: isNaN(score) ? 0 : Math.min(100, Math.max(0, score)),
      method: 'gpt_only'
    };
  } catch (error) {
    console.error('Error analyzing post relevance with GPT:', error);
    return { score: 0, method: 'gpt_error', error: error.message };
  }
}

// Keep the original function for backward compatibility
export async function analyzePostRelevance(post, searchPrompt, productDescription) {
  const result = await analyzePostRelevanceGPT(post, searchPrompt, productDescription);
  return result.score;
}

export async function generateResponse(post, type, dmPrompt, productName, productDescription, website) {
  try {
    let prompt;
    
    if (type === 'dm') {
      prompt = `
Generate a personalized direct message based on this template:
${dmPrompt}

POST DETAILS:
Title: ${post.title}
Content: ${post.selftext || 'No content'}
Author: ${post.author.name}
Subreddit: ${post.subreddit.display_name}

PRODUCT INFO:
Name: ${productName}
Description: ${productDescription}
Website: ${website || ''}

Replace placeholders:
- [recipient_first_name] with the Reddit username
- [post_reference] with a brief, natural reference to their post
- [product_name] with the product name
- [product_description] with a brief product pitch
- [website] with the website URL

Keep it conversational, helpful, and not overly salesy.
`;
    } else {
      prompt = `
Generate a helpful comment for this Reddit post that subtly mentions the product as a solution.

POST:
Title: ${post.title}
Content: ${post.selftext || 'No content'}
Subreddit: ${post.subreddit.display_name}

PRODUCT: ${productName} - ${productDescription}
Website: ${website || ''}

Make it:
- Genuinely helpful and relevant
- Natural, not promotional
- Adds value to the discussion
- Mentions the product as one option among others
`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating response:', error);
    return type === 'dm' ? 'Hi! I saw your post and thought you might be interested in our solution.' : 'Great question! You might want to check out some of the tools available for this.';
  }
} 
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ragService } from './ragService.js';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze post relevance with RAG matching against seed document
 * @param {Object} post - Reddit post object
 * @param {Object} campaign - Campaign object with search_prompt, description, etc.
 * @param {number} ragThreshold - RAG similarity threshold (default 0.6)
 * @returns {Promise<{score: number, method: string}>}
 */
export async function analyzePostRelevanceWithRAG(post, campaign, ragThreshold = 0.6) {
  try {
    // Query post against collection (seed document only)
    const queryResult = await ragService.queryForMatching(campaign.id, post, ragThreshold);
    
    if (!queryResult.success) {
      // RAG failed, no analysis
      return { score: 0, method: 'rag_failed' };
    }
    
    if (!queryResult.shouldProcess) {
      // No similarity to any document above threshold
      return { score: 0, method: 'rag_filtered' };
    }
    
    // Analyze with GPT
    const gptResult = await analyzePostRelevanceGPT(post, campaign.search_prompt, campaign.description);
    
    // Final score: average of GPT score + RAG similarity (converted to 0-100)
    const ragScore = Math.round(queryResult.similarity * 100); // Convert 0-1 to 0-100
    const finalScore = Math.round((gptResult.score + ragScore) / 2);
    
    return { score: finalScore, method: 'rag_then_gpt' };
    
  } catch (error) {
    console.error('Error in RAG pipeline:', error);
    return { score: 0, method: 'error' };
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
4. We will rank those post lower if they are looking to learn or seeking study or learning guidance, basically student type, job seekers, careerr related, etc. Are not qualified at all. 

Respond with ONLY a number from 0-100.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
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
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating response:', error);
    return type === 'dm' ? 'Hi! I saw your post and thought you might be interested in our solution.' : 'Great question! You might want to check out some of the tools available for this.';
  }
} 

/**
 * Generate subreddit suggestions using AI
 * @param {string} productName - Product name
 * @param {string} productDescription - Product description
 * @returns {Promise<string[]>} Array of suggested subreddit names
 */
export async function generateSubredditSuggestions(productName, productDescription) {
  try {
    const prompt = `Based on this product, suggest upto 20 relevant Reddit subreddits where potential customers might be asking for help or discussing related topics.

Product: ${productName}
Description: ${productDescription}

Requirements:
- Focus on subreddits where people actively ask for recommendations or help
- Include both niche and broader communities
- Avoid overly promotional or spam-heavy subreddits
- Return only the subreddit names (without r/ prefix)
- One subreddit per line

Examples of good subreddits for different products:
- AI tools: artificial, MachineLearning, ChatGPT, OpenAI, datascience
- SaaS: SaaS, entrepreneur, startups, smallbusiness, productivity
- E-commerce: ecommerce, dropship, shopify, marketing, smallbusiness

Suggested subreddits:`;

    const response = await openai.chat.completions.create({
      model:'gpt-5',
      messages: [{ role: 'user', content: prompt }],
    });

    const suggestions = response.choices[0].message.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.includes(':') && !line.startsWith('-'))
      .map(line => line.replace(/^r\//, '').replace(/^\d+\.\s*/, ''))
      .filter(subreddit => subreddit.length > 0 && subreddit.length < 25)
      .slice(0, 20);

    return suggestions;
  } catch (error) {
    console.error('Error generating subreddit suggestions:', error);
    // Fallback to basic suggestions
    return ['entrepreneur', 'startups', 'smallbusiness', 'SaaS', 'marketing'];
  }
} 
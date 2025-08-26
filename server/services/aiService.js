import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzePostRelevance(post, searchPrompt, productDescription) {
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
    return isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
  } catch (error) {
    console.error('Error analyzing post relevance:', error);
    return 0;
  }
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
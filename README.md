# Reddit Alerts - AI Lead Generation

A powerful tool that helps you find potential customers on Reddit using AI. Inspired by Popsy.ai, this application scans subreddits for relevant posts and generates personalized responses to help you connect with leads.

## 🚀 Features

- **AI-Powered Post Discovery**: Automatically finds relevant Reddit posts based on your product description
- **Smart Relevance Scoring**: AI rates each post's relevance from 0-100%
- **Response Generation**: Creates personalized DMs and comments using AI
- **Real-time Monitoring**: Continuously scans subreddits for new opportunities
- **Customizable Prompts**: Fine-tune search criteria and response templates
- **Clean Dashboard**: Intuitive interface matching modern design standards

## 🛠️ Tech Stack

- **Backend**: Express.js, SQLite, Node.js
- **Frontend**: React, Vite, Tailwind CSS
- **APIs**: Reddit API (Snoowrap), OpenAI API
- **Database**: SQLite with automatic schema creation

## 📋 Prerequisites

1. **Reddit API Credentials**
   - Create a Reddit app at https://www.reddit.com/prefs/apps
   - Note down your client ID, client secret, username, and password

2. **OpenAI API Key**
   - Get your API key from https://platform.openai.com/api-keys

## 🚀 Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd reddit-alerts
npm install
\`\`\`

### 2. Environment Setup

Copy the environment template and fill in your credentials:

\`\`\`bash
cp env.example .env
\`\`\`

Edit `.env` with your credentials:

\`\`\`env
# Reddit API Credentials
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=reddit-alerts-bot/1.0

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=3001
\`\`\`

### 3. Run the Application

\`\`\`bash
npm run dev
\`\`\`

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

## 📖 How to Use

### 1. Onboarding
- Enter your product name and description
- Select relevant subreddits where your customers might be
- The app suggests subreddits based on your product type

### 2. Dashboard
- View discovered posts in the left panel
- Use the relevance slider to filter posts (60-90% recommended)
- Filter by specific subreddits
- Click on posts to view details and generate responses

### 3. Response Generation
- **DMs**: Generate personalized direct messages (higher success rate)
- **Comments**: Create helpful comments (be careful of subreddit rules)
- Use "Copy & Open DM" to copy the message and open Reddit

### 4. Customization
- Click "Edit Prompts" to customize search criteria
- Modify DM templates with placeholders like [recipient_first_name]
- Update your website URL for automatic inclusion

## 🎯 Best Practices

### For Better Results:
1. **Be Specific**: Use detailed product descriptions for better AI matching
2. **Choose Relevant Subreddits**: Focus on 3-5 highly relevant subreddits
3. **Prefer DMs**: Direct messages have higher response rates than comments
4. **Personalize Templates**: Customize your DM templates to sound natural
5. **Monitor Regularly**: Check the dashboard daily for new opportunities

### Avoiding Issues:
- **Respect Subreddit Rules**: Many subreddits ban promotional comments
- **Don't Spam**: Space out your outreach efforts
- **Be Genuine**: Focus on being helpful rather than purely promotional
- **Test Your Approach**: Start with a few messages to refine your strategy

## 🔧 Configuration

### Search Prompt Examples:
\`\`\`
# For Website Builders
"Find posts where users are explicitly asking for advice on building websites, need help choosing website builders, or are looking for no-code solutions"

# For AI Tools
"Find posts where users are asking about AI tools, automation, or need help with tasks that AI can solve"

# For SaaS Products
"Find posts where users are discussing business problems that my SaaS product can solve"
\`\`\`

### DM Template Placeholders:
- `[recipient_first_name]` - Reddit username
- `[post_reference]` - Brief reference to their post
- `[product_name]` - Your product name
- `[product_description]` - Your product description
- `[website]` - Your website URL

## 📊 Database Schema

The app automatically creates these tables:
- **campaigns**: Store product information and settings
- **posts**: Reddit posts with relevance scores
- **responses**: Generated DMs and comments

## 🔄 Background Processing

- Scans subreddits every 5 minutes
- Only saves posts with relevance score > 30%
- Automatically analyzes new posts with AI
- Prevents duplicate post processing

## 🚨 Rate Limiting

The app respects Reddit's API rate limits:
- Scans 25 newest posts per subreddit per cycle
- 5-minute intervals between scans
- Proper error handling for API limits

## 🐛 Troubleshooting

### Common Issues:

1. **Reddit API Errors**
   - Check your credentials in `.env`
   - Ensure your Reddit account has API access
   - Verify your user agent string

2. **No Posts Appearing**
   - Lower the relevance filter
   - Check if subreddits are active
   - Verify your search prompt is not too restrictive

3. **AI Generation Fails**
   - Check your OpenAI API key
   - Ensure you have API credits
   - Try regenerating responses

## 📝 Development

### Project Structure:
\`\`\`
reddit-alerts/
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── database.js        # SQLite setup
├── src/                   # React frontend
│   ├── components/        # UI components
│   └── services/          # API calls
└── package.json
\`\`\`

### Available Scripts:
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start only backend
- `npm run client` - Start only frontend
- `npm run build` - Build for production

## 📄 License

MIT License - feel free to use this for your own projects!

## 🤝 Contributing

Contributions welcome! Please feel free to submit issues and pull requests.

---

**Note**: This tool is for legitimate business outreach. Always respect Reddit's terms of service and community guidelines. 
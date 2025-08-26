# Project Brief: Reddit Alerts - AI Lead Generation Platform

## Project Overview
Reddit Alerts is an AI-powered lead generation tool that helps businesses find potential customers on Reddit by automatically scanning subreddits for relevant posts and generating personalized outreach responses.

## Core Problem Statement
Businesses struggle to find and engage with potential customers on Reddit because:
- Manual searching is time-intensive and inefficient
- Identifying relevant posts requires domain expertise
- Crafting personalized responses at scale is challenging
- Reddit's vast content makes it hard to find quality leads
- Most businesses lack systematic Reddit outreach strategies

## Solution Approach
Build an automated system that:
1. **Discovers** relevant Reddit posts using AI-powered analysis
2. **Scores** post relevance (0-100%) based on business criteria
3. **Generates** personalized DMs and comments using AI
4. **Monitors** subreddits continuously for new opportunities
5. **Provides** an intuitive dashboard for lead management

## Success Criteria
- **Functional**: Successfully find and score Reddit posts with >70% accuracy
- **Usable**: Complete onboarding and generate first response within 5 minutes
- **Scalable**: Handle multiple subreddits and campaigns simultaneously
- **Effective**: Generate responses that achieve >25% engagement rates
- **Compliant**: Respect Reddit API limits and community guidelines

## Technical Requirements
- **Backend**: Express.js server with Reddit API integration
- **Frontend**: Modern React application with real-time updates
- **AI Integration**: OpenAI for post analysis and response generation
- **Database**: SQLite for campaign and post storage
- **Automation**: Background scanning every 5 minutes

## Business Model Inspiration
Based on Popsy.ai's proven approach:
- Freemium model with usage-based pricing
- Focus on small businesses and entrepreneurs
- Emphasis on high-quality, personalized outreach
- Strong emphasis on user education and best practices

## Key Differentiators
1. **Open Source**: Unlike Popsy's closed platform
2. **Self-Hosted**: Privacy-conscious deployment option
3. **Customizable**: Full control over AI prompts and logic
4. **Transparent**: Clear relevance scoring and reasoning

## Project Scope
**Phase 1 (MVP)**: Core functionality matching Popsy's demo
- Onboarding flow with product setup
- Subreddit monitoring and post discovery
- AI-powered relevance scoring
- Response generation (DMs and comments)
- Basic dashboard with filtering

**Phase 2 (Enhancement)**: Advanced features
- Multiple campaign management
- Analytics and reporting
- Advanced filtering and search
- Integration with other platforms

**Phase 3 (Scale)**: Enterprise features
- Team collaboration
- Advanced analytics
- Custom AI model training
- API for third-party integrations

## Timeline
- **Week 1**: Core backend and frontend infrastructure
- **Week 2**: AI integration and response generation
- **Week 3**: Polish, testing, and deployment preparation

## Risk Mitigation
- **Reddit API Changes**: Use official API with proper error handling
- **AI Costs**: Implement smart caching and relevance thresholds
- **Rate Limits**: Respect API limits with proper queuing
- **User Abuse**: Built-in guidelines and best practices education 
# System Patterns: Reddit Alerts Architecture

## Overall Architecture Pattern

### Microservices-Inspired Monolith
- **Single codebase** with clear service boundaries
- **Modular backend services** (Reddit, AI, Database, Scanner)
- **Clean API layer** separating frontend and backend concerns
- **Event-driven background processing** for scanning

### Technology Stack Decisions

#### Backend: Express.js + Node.js
**Why Chosen:**
- Excellent Reddit API library (Snoowrap)
- Native JSON handling for API responses
- Rich ecosystem for AI integrations
- Fast development cycle for MVP

**Key Patterns:**
- RESTful API design with clear resource boundaries
- Async/await for all external API calls
- Centralized error handling and logging
- Environment-based configuration

#### Frontend: React + Vite + Tailwind CSS
**Why Chosen:**
- Component-based architecture for reusable UI
- Vite for fast development and hot reloading
- Tailwind for rapid, consistent styling
- Modern React patterns (hooks, context)

**Key Patterns:**
- Custom hooks for API state management
- Component composition over inheritance
- Centralized API service layer
- Real-time updates with polling

#### Database: SQLite
**Why Chosen:**
- Zero-configuration setup for MVP
- ACID compliance for data integrity
- File-based for easy deployment
- Sufficient performance for expected scale

**Schema Patterns:**
- Normalized design with foreign key relationships
- JSON columns for flexible data (subreddits array)
- Timestamps for audit trails
- Unique constraints to prevent duplicates

## Core Service Patterns

### 1. Reddit Integration Service
```javascript
// Pattern: Singleton client with connection pooling
class RedditClient {
  static instance = null
  
  static getClient() {
    if (!this.instance) {
      this.instance = new snoowrap(credentials)
    }
    return this.instance
  }
}
```

**Key Decisions:**
- Single Reddit client instance to respect rate limits
- Graceful error handling for API failures
- Automatic retry logic with exponential backoff
- Request queuing to prevent overwhelming Reddit API

### 2. AI Analysis Service
```javascript
// Pattern: Stateless service with caching
class AIService {
  async analyzeRelevance(post, criteria) {
    // Cache results to avoid re-analyzing same posts
    // Use structured prompts for consistent results
    // Implement fallback scoring for API failures
  }
}
```

**Key Decisions:**
- Structured prompts for consistent AI responses
- Relevance scoring on 0-100 scale for easy filtering
- Caching to reduce API costs and improve performance
- Fallback mechanisms when AI service is unavailable

### 3. Background Scanner Service
```javascript
// Pattern: Cron-based job processor
class RedditScanner {
  schedule() {
    cron.schedule('*/5 * * * *', this.scanAllCampaigns)
  }
  
  async scanCampaign(campaign) {
    // Process subreddits sequentially to respect rate limits
    // Skip already processed posts
    // Batch database operations for efficiency
  }
}
```

**Key Decisions:**
- 5-minute scanning intervals to balance freshness and rate limits
- Sequential processing to avoid overwhelming Reddit API
- Duplicate detection to prevent reprocessing posts
- Graceful handling of subreddit access issues

## Data Flow Patterns

### 1. Campaign Creation Flow
```
User Input → Validation → Database Storage → Scanner Registration → Background Scanning
```

### 2. Post Discovery Flow
```
Reddit API → Relevance Analysis → Database Storage → Real-time Frontend Updates
```

### 3. Response Generation Flow
```
User Request → Post Context Retrieval → AI Generation → Database Caching → User Display
```

## API Design Patterns

### RESTful Resource Design
```
GET    /api/campaigns           # List campaigns
POST   /api/campaigns           # Create campaign
GET    /api/campaigns/:id       # Get campaign
PUT    /api/campaigns/:id       # Update campaign
DELETE /api/campaigns/:id       # Delete campaign

GET    /api/reddit/posts/:campaignId    # Get posts for campaign
POST   /api/reddit/posts/:postId/response # Generate response
GET    /api/reddit/subreddits/:campaignId # Get subreddit stats
```

### Response Standardization
```javascript
// Success Response Pattern
{
  data: { /* actual data */ },
  meta: { timestamp, version }
}

// Error Response Pattern
{
  error: {
    code: "VALIDATION_ERROR",
    message: "User-friendly message",
    details: { /* technical details */ }
  }
}
```

## Frontend Architecture Patterns

### Component Hierarchy
```
App
├── Onboarding
│   ├── ProductForm
│   └── SubredditSelector
└── Dashboard
    ├── PostList
    ├── PostDetail
    └── SettingsModal
```

### State Management Pattern
- **Local State**: Component-specific UI state (loading, form data)
- **API State**: Server data managed by custom hooks
- **Global State**: Minimal - only current campaign via prop drilling

### Custom Hooks Pattern
```javascript
// Pattern: Encapsulate API logic in reusable hooks
function usePosts(campaignId, filters) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Auto-refresh logic
  // Error handling
  // Filtering logic
  
  return { posts, loading, refetch }
}
```

## Security Patterns

### API Security
- **Environment Variables**: All secrets in .env files
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Respect external API limits
- **Error Sanitization**: Don't expose internal errors to frontend

### Reddit API Compliance
- **User Agent**: Proper identification in all requests
- **Rate Limiting**: Built-in delays between requests
- **Error Handling**: Graceful degradation on API failures
- **Terms Compliance**: Respect Reddit's terms of service

## Performance Patterns

### Database Optimization
- **Indexes**: On frequently queried columns (campaign_id, reddit_id)
- **Batch Operations**: Group inserts/updates for efficiency
- **Connection Pooling**: Reuse database connections
- **Query Optimization**: Use appropriate JOINs and WHERE clauses

### Frontend Performance
- **Code Splitting**: Lazy load components when needed
- **Memoization**: Prevent unnecessary re-renders
- **Debouncing**: Limit API calls from user interactions
- **Caching**: Store API responses in component state

### Background Processing
- **Queue Management**: Process tasks sequentially
- **Error Recovery**: Retry failed operations with backoff
- **Resource Management**: Limit concurrent operations
- **Monitoring**: Log performance metrics and errors

## Error Handling Patterns

### Three-Layer Error Handling
1. **Service Layer**: Catch and categorize errors
2. **API Layer**: Transform errors to user-friendly messages
3. **Frontend Layer**: Display appropriate user feedback

### Error Categories
- **User Errors**: Invalid input, missing data
- **System Errors**: Database failures, network issues
- **External Errors**: Reddit API failures, AI service issues
- **Business Errors**: Rate limits exceeded, invalid operations

## Deployment Patterns

### Environment Configuration
- **Development**: Local SQLite, mock external services
- **Staging**: Production-like setup with test data
- **Production**: Optimized for performance and reliability

### Process Management
- **Single Process**: Express server handles both API and static files
- **Background Jobs**: Integrated cron scheduler
- **Database**: File-based SQLite for simplicity
- **Logging**: Console output with structured formatting

## Monitoring and Observability

### Key Metrics to Track
- **Reddit API**: Request count, rate limit status, error rates
- **AI Service**: Token usage, response times, error rates
- **Database**: Query performance, connection count, storage usage
- **User Activity**: Campaign creation, post discovery, response generation

### Logging Strategy
- **Structured Logging**: JSON format for easy parsing
- **Error Tracking**: Full stack traces with context
- **Performance Logging**: Response times for key operations
- **Business Metrics**: User actions and system health 
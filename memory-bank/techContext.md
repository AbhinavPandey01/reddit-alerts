# Technical Context: Reddit Alerts

## Technology Stack Overview

### Backend Technologies

#### Core Framework: Express.js 4.18.2
**Purpose**: Web server and API framework
**Why Chosen**: 
- Mature, stable framework with excellent ecosystem
- Perfect for RESTful API development
- Great middleware support for CORS, JSON parsing, etc.
- Easy integration with Reddit and AI APIs

**Key Dependencies**:
- `cors`: Cross-origin resource sharing for frontend communication
- `dotenv`: Environment variable management
- `node-cron`: Scheduled task execution for background scanning

#### Reddit API: Snoowrap 1.23.0
**Purpose**: Reddit API client library
**Why Chosen**:
- Most mature Node.js Reddit API wrapper
- Handles OAuth authentication automatically
- Built-in rate limiting and error handling
- Comprehensive coverage of Reddit API endpoints

**Configuration Requirements**:
- Reddit app credentials (client ID, secret)
- Reddit account credentials (username, password)
- User agent string for API identification

#### AI Integration: OpenAI 4.20.1
**Purpose**: Post analysis and response generation
**Why Chosen**:
- Most reliable AI API for text analysis
- Excellent prompt engineering capabilities
- Consistent response quality
- Good rate limiting and error handling

**Usage Patterns**:
- GPT-3.5-turbo for cost-effective analysis
- Structured prompts for consistent scoring
- Temperature settings optimized for each use case
- Token management to control costs

#### Database: SQLite3 5.1.6
**Purpose**: Data persistence and querying
**Why Chosen**:
- Zero-configuration database setup
- ACID compliance for data integrity
- File-based storage for easy deployment
- Sufficient performance for expected scale
- No external database server required

**Schema Design**:
- Normalized tables with foreign key relationships
- JSON columns for flexible data storage
- Proper indexing for query performance
- Timestamp tracking for audit trails

### Frontend Technologies

#### Build Tool: Vite 5.0.0
**Purpose**: Development server and build tool
**Why Chosen**:
- Lightning-fast hot module replacement
- Optimized production builds
- Excellent React integration
- Modern ES modules support
- Built-in proxy for API calls

**Configuration**:
- React plugin for JSX support
- Proxy setup for backend API calls
- Tailwind CSS integration
- Production build optimization

#### UI Framework: React 18.2.0
**Purpose**: User interface library
**Why Chosen**:
- Component-based architecture
- Excellent developer experience
- Rich ecosystem and community
- Modern hooks API for state management
- Great performance with virtual DOM

**Key Patterns**:
- Functional components with hooks
- Custom hooks for API integration
- Component composition over inheritance
- Controlled components for forms

#### Styling: Tailwind CSS 3.3.6
**Purpose**: Utility-first CSS framework
**Why Chosen**:
- Rapid development with utility classes
- Consistent design system
- Excellent responsive design support
- Small production bundle size
- Easy customization and theming

**Configuration**:
- Custom color palette for branding
- Component classes for common patterns
- Responsive breakpoints
- Dark mode support (future)

## Development Environment Setup

### Prerequisites
1. **Node.js 18+**: Runtime environment
2. **npm 9+**: Package manager
3. **Reddit Developer Account**: API access
4. **OpenAI Account**: AI API access
5. **Code Editor**: VS Code recommended with extensions

### Environment Variables
```env
# Reddit API Credentials
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_USER_AGENT=reddit-alerts-bot/1.0

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Development Scripts
- `npm run dev`: Start both frontend and backend in development mode
- `npm run server`: Start only the Express backend server
- `npm run client`: Start only the Vite development server
- `npm run build`: Build frontend for production
- `npm run preview`: Preview production build locally

### File Structure
```
reddit-alerts/
├── server/                    # Backend Express application
│   ├── routes/               # API route handlers
│   │   ├── campaigns.js      # Campaign CRUD operations
│   │   └── reddit.js         # Reddit-related endpoints
│   ├── services/             # Business logic services
│   │   ├── redditClient.js   # Reddit API wrapper
│   │   ├── aiService.js      # OpenAI integration
│   │   └── redditScanner.js  # Background scanning logic
│   ├── database.js           # SQLite database setup
│   └── index.js              # Express server entry point
├── src/                      # Frontend React application
│   ├── components/           # React components
│   │   ├── Onboarding.jsx    # User onboarding flow
│   │   ├── Dashboard.jsx     # Main dashboard
│   │   ├── PostList.jsx      # Post listing component
│   │   ├── PostDetail.jsx    # Post detail view
│   │   └── SettingsModal.jsx # Settings configuration
│   ├── services/             # Frontend services
│   │   └── api.js            # API client wrapper
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles and Tailwind
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # Project documentation
```

## API Integration Patterns

### Reddit API Integration
**Authentication**: OAuth2 with username/password flow
**Rate Limiting**: Built-in respect for Reddit's limits
**Error Handling**: Graceful degradation on API failures
**Data Processing**: Real-time analysis of post content

**Key Endpoints Used**:
- `getSubreddit(name).getNew()`: Fetch latest posts
- `getSubmission(id)`: Get detailed post information
- User profile access for context

### OpenAI API Integration
**Model**: GPT-3.5-turbo for cost-effectiveness
**Prompt Engineering**: Structured prompts for consistent results
**Token Management**: Optimized for cost control
**Error Handling**: Fallback responses on API failures

**Usage Patterns**:
- Post relevance analysis (0-100 scoring)
- Personalized DM generation
- Helpful comment creation
- Context-aware response crafting

## Performance Considerations

### Backend Performance
- **Database Queries**: Optimized with proper indexing
- **API Rate Limits**: Respect external service limits
- **Memory Usage**: Efficient data structures and cleanup
- **Background Processing**: Non-blocking operations

### Frontend Performance
- **Bundle Size**: Code splitting and lazy loading
- **Re-renders**: Optimized with React.memo and useMemo
- **API Calls**: Debouncing and caching strategies
- **Real-time Updates**: Efficient polling intervals

### Scalability Constraints
- **SQLite Limits**: ~1TB database size, thousands of concurrent reads
- **Reddit API**: 60 requests per minute per OAuth app
- **OpenAI API**: Rate limits based on subscription tier
- **Memory**: Node.js heap size limitations

## Security Considerations

### Data Security
- **Environment Variables**: Sensitive data not in code
- **Input Validation**: All user inputs sanitized
- **SQL Injection**: Parameterized queries only
- **XSS Protection**: React's built-in escaping

### API Security
- **Authentication**: Secure credential storage
- **Rate Limiting**: Prevent API abuse
- **Error Handling**: Don't expose internal details
- **CORS**: Proper cross-origin configuration

### Reddit Compliance
- **Terms of Service**: Respect Reddit's rules
- **Rate Limiting**: Stay within API limits
- **User Privacy**: Don't store sensitive user data
- **Community Guidelines**: Promote respectful engagement

## Deployment Architecture

### Development Deployment
- **Local SQLite**: File-based database
- **Concurrent Processes**: Frontend and backend together
- **Hot Reloading**: Instant development feedback
- **Mock Data**: Test data for development

### Production Deployment Options

#### Option 1: Single Server (Recommended for MVP)
- **Process**: Single Node.js process serving both API and static files
- **Database**: SQLite file on server filesystem
- **Reverse Proxy**: Nginx for SSL termination and caching
- **Process Management**: PM2 for process monitoring

#### Option 2: Container Deployment
- **Docker**: Containerized application
- **Volume Mounts**: Persistent SQLite storage
- **Environment**: Container-based configuration
- **Orchestration**: Docker Compose or Kubernetes

#### Option 3: Serverless (Future)
- **Functions**: Separate functions for different operations
- **Database**: Cloud-based SQLite or PostgreSQL
- **Scheduling**: Cloud-based cron jobs
- **Static Hosting**: CDN for frontend assets

## Monitoring and Debugging

### Development Tools
- **Browser DevTools**: React Developer Tools extension
- **Network Monitoring**: API call inspection
- **Console Logging**: Structured development logs
- **Hot Reloading**: Instant feedback on changes

### Production Monitoring
- **Application Logs**: Structured JSON logging
- **Error Tracking**: Centralized error collection
- **Performance Metrics**: Response times and throughput
- **Health Checks**: API endpoint monitoring

### Debugging Strategies
- **Logging Levels**: Debug, info, warn, error
- **Error Context**: Full stack traces with request context
- **API Debugging**: Request/response logging for external APIs
- **Database Debugging**: Query performance monitoring

## Future Technical Considerations

### Scalability Improvements
- **Database Migration**: PostgreSQL for larger scale
- **Caching Layer**: Redis for improved performance
- **Load Balancing**: Multiple server instances
- **CDN Integration**: Static asset optimization

### Feature Enhancements
- **Real-time Updates**: WebSocket connections
- **Mobile App**: React Native application
- **API Versioning**: Backward compatibility
- **Plugin System**: Extensible architecture

### Infrastructure Evolution
- **Microservices**: Service decomposition
- **Message Queues**: Asynchronous processing
- **Container Orchestration**: Kubernetes deployment
- **Cloud Services**: Managed database and AI services 
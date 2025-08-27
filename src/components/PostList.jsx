import React from 'react'

function PostList({ 
  posts, 
  selectedPost, 
  subreddits,
  relevanceFilter,
  subredditFilter,
  sortBy = 'relevance',
  onRelevanceChange,
  onSubredditChange,
  onSortChange,
  onPostSelect, 
  loading 
}) {
  // Sort posts based on sortBy
  const sortedPosts = React.useMemo(() => {
    const sorted = [...posts]
    switch (sortBy) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.reddit_created_at) - new Date(a.reddit_created_at))
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.reddit_created_at) - new Date(b.reddit_created_at))
      case 'relevance':
      default:
        return sorted.sort((a, b) => b.relevance_score - a.relevance_score)
    }
  }, [posts, sortBy])

  const copyAllPosts = () => {
    if (sortedPosts.length === 0) return;
    
    const markdownContent = sortedPosts.map(post => {
      const date = new Date(post.reddit_created_at).toLocaleDateString()
      return `# ${post.title}

**Subreddit:** r/${post.subreddit}  
**Author:** u/${post.author}  
**Date:** ${date}  
**Relevance:** ${post.relevance_score}%  
**URL:** ${post.url}

${post.content || 'No content'}

---
`
    }).join('\n')
    
    navigator.clipboard.writeText(markdownContent)
    // Could add a toast notification here
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Inbox</h2>
          <button
            onClick={copyAllPosts}
            disabled={sortedPosts.length === 0}
            className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy all filtered posts as Markdown"
          >
            <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy All ({sortedPosts.length})
          </button>
        </div>
        
        {/* Relevance Slider */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relevance: {relevanceFilter}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={relevanceFilter}
            onChange={(e) => onRelevanceChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Subreddit Filter */}
        {subreddits.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Subreddit
            </label>
            <select
              value={subredditFilter}
              onChange={(e) => onSubredditChange(e.target.value)}
              className="input text-sm"
            >
              <option value="">All Subreddits</option>
              {subreddits.map(sub => (
                <option key={sub.subreddit} value={sub.subreddit}>
                  r/{sub.subreddit} ({sub.post_count})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
            className="input text-sm"
          >
            <option value="relevance">Relevance (High to Low)</option>
            <option value="date_desc">Date (Newest First)</option>
            <option value="date_asc">Date (Oldest First)</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-2">No posts found</p>
            <p className="text-sm text-gray-400">
              Try lowering the relevance filter or wait for new posts to be discovered
            </p>
          </div>
        ) : (
          sortedPosts.map(post => (
            <div
              key={post.id}
              onClick={() => onPostSelect(post)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedPost?.id === post.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                  {post.title}
                </h3>
                <div className="flex items-center space-x-2 ml-2">
                  {post.is_starred && (
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.relevance_score >= 80 
                      ? 'bg-green-100 text-green-800'
                      : post.relevance_score >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {post.relevance_score}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-500 space-x-2">
                <span>r/{post.subreddit}</span>
                <span>•</span>
                <span>u/{post.author}</span>
                <span>•</span>
                <span>{new Date(post.reddit_created_at).toLocaleDateString()}</span>
              </div>
              
              {post.content && (
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                  {post.content.substring(0, 100)}...
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default PostList 
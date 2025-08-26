import React from 'react'

function PostList({ 
  posts, 
  selectedPost, 
  subreddits,
  relevanceFilter,
  subredditFilter,
  onRelevanceChange,
  onSubredditChange,
  onPostSelect, 
  loading 
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Filters Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Inbox</h2>
        
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
          posts.map(post => (
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
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  post.relevance_score >= 80 
                    ? 'bg-green-100 text-green-800'
                    : post.relevance_score >= 60
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {post.relevance_score}%
                </span>
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
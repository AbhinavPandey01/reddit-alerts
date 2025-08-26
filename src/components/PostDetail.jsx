import React, { useState } from 'react'
import { api } from '../services/api'

function PostDetail({ post, campaign }) {
  const [dmContent, setDmContent] = useState(post.dm_content || '')
  const [commentContent, setCommentContent] = useState(post.comment_content || '')
  const [generating, setGenerating] = useState({ dm: false, comment: false })

  const generateResponse = async (type) => {
    setGenerating(prev => ({ ...prev, [type]: true }))
    
    try {
      const response = await api.generateResponse(post.id, type)
      
      if (type === 'dm') {
        setDmContent(response.content)
      } else {
        setCommentContent(response.content)
      }
    } catch (error) {
      console.error(`Error generating ${type}:`, error)
      alert(`Failed to generate ${type}. Please try again.`)
    } finally {
      setGenerating(prev => ({ ...prev, [type]: false }))
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const openRedditDM = () => {
    if (dmContent) {
      copyToClipboard(dmContent)
      window.open(`https://www.reddit.com/user/${post.author}`, '_blank')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Post Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex-1">
            {post.title}
          </h2>
          <span className={`ml-4 px-3 py-1 text-sm rounded-full ${
            post.relevance_score >= 80 
              ? 'bg-green-100 text-green-800'
              : post.relevance_score >= 60
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {post.relevance_score}% relevant
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
          <span>r/{post.subreddit}</span>
          <span>u/{post.author}</span>
          <span>{new Date(post.reddit_created_at).toLocaleDateString()}</span>
          <a 
            href={post.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            View on Reddit →
          </a>
        </div>

        {post.content && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
          </div>
        )}
      </div>

      {/* Response Generation */}
      <div className="p-6 space-y-6">
        {/* DM Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Suggested DM</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => generateResponse('dm')}
                disabled={generating.dm}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {generating.dm ? 'Generating...' : 'Generate'}
              </button>
              {dmContent && (
                <>
                  <button
                    onClick={() => copyToClipboard(dmContent)}
                    className="btn-secondary text-sm"
                  >
                    Copy
                  </button>
                  <button
                    onClick={openRedditDM}
                    className="btn-primary text-sm"
                  >
                    Copy & Open DM
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
            {dmContent ? (
              <p className="text-gray-700 whitespace-pre-wrap">{dmContent}</p>
            ) : (
              <p className="text-gray-500 italic">Click "Generate" to create a personalized DM</p>
            )}
          </div>
        </div>

        {/* Comment Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Suggested Comment</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => generateResponse('comment')}
                disabled={generating.comment}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {generating.comment ? 'Generating...' : 'Generate'}
              </button>
              {commentContent && (
                <button
                  onClick={() => copyToClipboard(commentContent)}
                  className="btn-secondary text-sm"
                >
                  Copy Comment
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
            {commentContent ? (
              <p className="text-gray-700 whitespace-pre-wrap">{commentContent}</p>
            ) : (
              <p className="text-gray-500 italic">Click "Generate" to create a helpful comment</p>
            )}
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Be careful with comments as some subreddits have strict no-promotion policies. 
            Direct messages are generally more permissive and often have better response rates.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PostDetail 
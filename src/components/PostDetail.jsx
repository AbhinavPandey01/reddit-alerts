import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

function PostDetail({ post, campaign }) {
  const [dmContent, setDmContent] = useState(post.dm_content || '')
  const [commentContent, setCommentContent] = useState(post.comment_content || '')
  const [generating, setGenerating] = useState({ dm: false, comment: false })
  const [isStarred, setIsStarred] = useState(post.is_starred || false)
  const [starring, setStarring] = useState(false)

  // Clear content when post changes
  useEffect(() => {
    setDmContent(post.dm_content || '')
    setCommentContent(post.comment_content || '')
    setIsStarred(post.is_starred || false)
  }, [post.id])

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

  const clearContent = (type) => {
    if (type === 'dm') {
      setDmContent('')
    } else {
      setCommentContent('')
    }
  }

  const copyPostAsMarkdown = () => {
    const date = new Date(post.reddit_created_at).toLocaleDateString()
    const markdownContent = `# ${post.title}

**Subreddit:** r/${post.subreddit}  
**Author:** u/${post.author}  
**Date:** ${date}  
**Relevance:** ${post.relevance_score}%  
**URL:** ${post.url}

${post.content || 'No content'}`

    navigator.clipboard.writeText(markdownContent)
  }

  const toggleStar = async () => {
    setStarring(true)
    
    try {
      if (isStarred) {
        await api.unstarPost(post.id)
        setIsStarred(false)
      } else {
        await api.starPost(post.id)
        setIsStarred(true)
      }
    } catch (error) {
      console.error('Error toggling star:', error)
      alert(`Failed to ${isStarred ? 'unstar' : 'star'} post. Please try again.`)
    } finally {
      setStarring(false)
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
          <div className="flex items-center space-x-3 ml-4">
            <button
              onClick={copyPostAsMarkdown}
              className="p-2 rounded-full transition-colors text-gray-400 hover:text-blue-500 hover:bg-blue-50"
              title="Copy post as Markdown"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={toggleStar}
              disabled={starring}
              className={`p-2 rounded-full transition-colors ${
                isStarred
                  ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              } ${starring ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isStarred ? 'Remove from starred matches' : 'Add to starred matches'}
            >
              <svg className="w-5 h-5" fill={isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <span className={`px-3 py-1 text-sm rounded-full ${
              post.relevance_score >= 80 
                ? 'bg-green-100 text-green-800'
                : post.relevance_score >= 60
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {post.relevance_score}% relevant
            </span>
          </div>
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
                  <button
                    onClick={() => clearContent('dm')}
                    className="btn-secondary text-sm text-red-600 hover:text-red-700"
                  >
                    Clear
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
                <>
                  <button
                    onClick={() => copyToClipboard(commentContent)}
                    className="btn-secondary text-sm"
                  >
                    Copy Comment
                  </button>
                  <button
                    onClick={() => clearContent('comment')}
                    className="btn-secondary text-sm text-red-600 hover:text-red-700"
                  >
                    Clear
                  </button>
                </>
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
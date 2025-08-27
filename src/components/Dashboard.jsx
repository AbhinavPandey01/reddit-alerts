import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import PostList from './PostList'
import PostDetail from './PostDetail'
import SettingsModal from './SettingsModal'

// Custom hook for localStorage persistence
const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      return defaultValue
    }
  })

  const setStoredValue = (newValue) => {
    try {
      setValue(newValue)
      window.localStorage.setItem(key, JSON.stringify(newValue))
    } catch (error) {
      console.error(`Error saving to localStorage:`, error)
    }
  }

  return [value, setStoredValue]
}

function Dashboard({ campaign, campaigns, onCampaignSelect, onNewCampaign, onCampaignDelete }) {
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [subreddits, setSubreddits] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [deletingCampaign, setDeletingCampaign] = useState(null)
  
  // Filters
  const [relevanceFilter, setRelevanceFilter] = useLocalStorage('reddit-alerts-relevance-filter', 60)
  const [subredditFilter, setSubredditFilter] = useLocalStorage('reddit-alerts-subreddit-filter', '')
  const [sortBy, setSortBy] = useLocalStorage('reddit-alerts-sort-by', 'relevance')

  useEffect(() => {
    loadData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPosts, 30000)
    return () => clearInterval(interval)
  }, [campaign.id, relevanceFilter, subredditFilter])

  const loadData = async () => {
    await Promise.all([loadPosts(), loadSubreddits()])
  }

  const loadPosts = async () => {
    try {
      const filters = {
        minRelevance: relevanceFilter,
        ...(subredditFilter && { subreddit: subredditFilter })
      }
      const postsData = await api.getPosts(campaign.id, filters)
      setPosts(postsData)
      
      // Auto-select first post if none selected
      if (!selectedPost && postsData.length > 0) {
        setSelectedPost(postsData[0])
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubreddits = async () => {
    try {
      const subredditsData = await api.getSubreddits(campaign.id)
      setSubreddits(subredditsData)
    } catch (error) {
      console.error('Error loading subreddits:', error)
    }
  }

  const handlePostSelect = (post) => {
    setSelectedPost(post)
  }

  const handleCampaignUpdate = (updatedCampaign) => {
    // Refresh data after campaign update
    loadData()
  }

  const handleDeleteCampaign = async (campaignToDelete) => {
    if (campaigns.length === 1) {
      alert('Cannot delete the last campaign. Create another campaign first.')
      return
    }

    if (window.confirm(`Are you sure you want to delete "${campaignToDelete.product_name}"? This will also delete all associated posts and responses.`)) {
      try {
        await api.deleteCampaign(campaignToDelete.id)
        onCampaignDelete(campaignToDelete.id)
      } catch (error) {
        console.error('Error deleting campaign:', error)
        alert('Failed to delete campaign. Please try again.')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Campaigns */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
            <button
              onClick={onNewCampaign}
              className="bg-primary-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              + New
            </button>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="flex-1 overflow-y-auto">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className={`group border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                campaign.id === camp.id ? 'bg-primary-50 border-primary-200' : ''
              }`}
            >
              <div className="flex items-start">
                <div
                  onClick={() => onCampaignSelect(camp)}
                  className="flex-1 p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${
                        campaign.id === camp.id ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {camp.product_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {camp.description}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <span>Created {formatDate(camp.created_at)}</span>
                      </div>
                    </div>
                    {campaign.id === camp.id && (
                      <div className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                {/* Delete Button */}
                <div className="p-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCampaign(camp)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-2 rounded-md hover:bg-red-50"
                    title="Delete campaign"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{campaign.product_name}</h1>
              <p className="text-gray-600 mt-1">{campaign.description}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left Panel - Posts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
              <PostList
                posts={posts}
                selectedPost={selectedPost}
                subreddits={subreddits}
                relevanceFilter={relevanceFilter}
                subredditFilter={subredditFilter}
                sortBy={sortBy}
                onRelevanceChange={setRelevanceFilter}
                onSubredditChange={setSubredditFilter}
                onSortChange={setSortBy}
                onPostSelect={handlePostSelect}
                loading={loading}
              />
            </div>
          </div>

          {/* Right Panel - Post Detail */}
          <div className="lg:col-span-2">
            {selectedPost ? (
              <PostDetail
                post={selectedPost}
                campaign={campaign}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Select a post to view details and generate responses</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          campaign={campaign}
          onClose={() => setShowSettings(false)}
          onUpdate={handleCampaignUpdate}
        />
      )}
    </div>
  )
}

export default Dashboard 
import React, { useState } from 'react'
import { api } from '../services/api'

function Onboarding({ onCampaignCreated }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [customSubreddit, setCustomSubreddit] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    website: '',
    subreddits: []
  })

  const getSuggestedSubreddits = () => {
    // Return AI suggestions if available, otherwise fallback to basic logic
    if (aiSuggestions.length > 0) {
      return aiSuggestions;
    }
    
    const productType = formData.product_name.toLowerCase()
    const description = formData.description.toLowerCase()
    
    // AI/Tech products
    if (productType.includes('ai') || description.includes('artificial intelligence') || 
        description.includes('machine learning') || productType.includes('tech')) {
      return ['artificial', 'MachineLearning', 'technology', 'startups', 'entrepreneur']
    }
    
    // SaaS products
    if (description.includes('saas') || description.includes('software') || 
        description.includes('platform') || description.includes('tool')) {
      return ['SaaS', 'entrepreneur', 'startups', 'smallbusiness', 'productivity']
    }
    
    // E-commerce
    if (description.includes('ecommerce') || description.includes('store') || 
        description.includes('shop') || description.includes('sell')) {
      return ['ecommerce', 'Entrepreneur', 'smallbusiness', 'dropship', 'marketing']
    }
    
    // Default suggestions
    return ['entrepreneur', 'startups', 'smallbusiness', 'SaaS', 'marketing']
  }

  const generateAISuggestions = async () => {
    if (!formData.product_name || !formData.description) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await api.getSubredditSuggestions(formData.product_name, formData.description);
      setAiSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      // Keep existing fallback suggestions
    } finally {
      setLoadingSuggestions(false);
    }
  }

  const handleSubredditToggle = (subreddit) => {
    setFormData(prev => ({
      ...prev,
      subreddits: prev.subreddits.includes(subreddit)
        ? prev.subreddits.filter(s => s !== subreddit)
        : [...prev.subreddits, subreddit]
    }))
  }

  const handleAddCustomSubreddit = () => {
    if (!customSubreddit.trim()) return
    
    // Remove 'r/' prefix if user included it
    const cleanSubreddit = customSubreddit.replace(/^r\//, '').trim()
    
    // Validate subreddit name (basic validation)
    if (!/^[A-Za-z0-9_]+$/.test(cleanSubreddit)) {
      alert('Invalid subreddit name. Use only letters, numbers, and underscores.')
      return
    }
    
    if (formData.subreddits.includes(cleanSubreddit)) {
      alert('This subreddit is already selected.')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      subreddits: [...prev.subreddits, cleanSubreddit]
    }))
    setCustomSubreddit('')
  }

  const handleCustomSubredditKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustomSubreddit()
    }
  }

  const handleRemoveSubreddit = (subreddit) => {
    setFormData(prev => ({
      ...prev,
      subreddits: prev.subreddits.filter(s => s !== subreddit)
    }))
  }

  const handleNext = () => {
    generateAISuggestions();
    setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const campaign = await api.createCampaign(formData)
      onCampaignCreated(campaign)
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mr-4 ${
            step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <div className="w-16 h-0.5 bg-gray-200 mr-4"></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
        </div>

        <div className="card">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">Tell us about your product</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Page.com"
                    value={formData.product_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description
                  </label>
                  <textarea
                    className="textarea h-32"
                    placeholder="Page is an AI website builder that helps you create beautiful websites in minutes without any coding knowledge..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://yourwebsite.com"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleNext}
                  disabled={!formData.product_name || !formData.description}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold mb-2">Select Subreddits</h2>
              <p className="text-gray-600 mb-6">
                Choose subreddits where your potential customers might be asking for help.
              </p>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    {aiSuggestions.length > 0 ? 'AI-powered suggestions for your product:' : 'Suggested for your product:'}
                  </h3>
                  {loadingSuggestions && (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating AI suggestions...
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedSubreddits().map(subreddit => (
                    <button
                      key={subreddit}
                      onClick={() => handleSubredditToggle(subreddit)}
                      disabled={loadingSuggestions}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.subreddits.includes(subreddit)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${loadingSuggestions ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      r/{subreddit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Subreddit Input */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Add custom subreddit:</h3>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      r/
                    </span>
                    <input
                      type="text"
                      className="input pl-8"
                      placeholder="entrepreneur"
                      value={customSubreddit}
                      onChange={(e) => setCustomSubreddit(e.target.value)}
                      onKeyPress={handleCustomSubredditKeyPress}
                    />
                  </div>
                  <button
                    onClick={handleAddCustomSubreddit}
                    disabled={!customSubreddit.trim()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter subreddit name without the "r/" prefix
                </p>
              </div>

              {formData.subreddits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Selected ({formData.subreddits.length}):
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.subreddits.map(subreddit => (
                      <span
                        key={subreddit}
                        className="group px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-sm flex items-center gap-2"
                      >
                        r/{subreddit}
                        <button
                          onClick={() => handleRemoveSubreddit(subreddit)}
                          className="text-primary-600 hover:text-primary-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={formData.subreddits.length === 0 || loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Campaign...' : 'Continue to Dashboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Onboarding 
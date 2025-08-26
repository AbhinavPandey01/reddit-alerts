import React, { useState } from 'react'
import { api } from '../services/api'

const SUGGESTED_SUBREDDITS = {
  'website builder': ['entrepreneur', 'smallbusiness', 'startups', 'webdev', 'web_design'],
  'ai tool': ['artificial', 'MachineLearning', 'ChatGPT', 'OpenAI', 'singularity'],
  'saas': ['SaaS', 'entrepreneur', 'startups', 'smallbusiness', 'EntrepreneurRideAlong'],
  'marketing': ['marketing', 'digitalmarketing', 'socialmedia', 'PPC', 'SEO'],
  'productivity': ['productivity', 'getmotivated', 'selfimprovement', 'lifehacks', 'organization']
}

function Onboarding({ onCampaignCreated }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    website: '',
    subreddits: []
  })

  const getSuggestedSubreddits = () => {
    const description = formData.description.toLowerCase()
    for (const [key, subreddits] of Object.entries(SUGGESTED_SUBREDDITS)) {
      if (description.includes(key)) {
        return subreddits
      }
    }
    return SUGGESTED_SUBREDDITS.saas // Default
  }

  const handleNext = () => {
    if (step === 1 && formData.product_name && formData.description) {
      setStep(2)
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

  const handleSubmit = async () => {
    if (formData.subreddits.length === 0) return

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reddit Alerts</h1>
          <p className="text-xl text-gray-600">Find leads on Reddit with AI</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
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
                    placeholder="https://page.com"
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

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested for your product:</h3>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedSubreddits().map(subreddit => (
                    <button
                      key={subreddit}
                      onClick={() => handleSubredditToggle(subreddit)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.subreddits.includes(subreddit)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      r/{subreddit}
                    </button>
                  ))}
                </div>
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
                        className="px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-sm"
                      >
                        r/{subreddit}
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
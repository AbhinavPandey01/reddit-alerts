import React, { useState } from 'react'
import { api } from '../services/api'

function SettingsModal({ campaign, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    search_prompt: campaign.search_prompt || 'Find posts where I can promote my product and find posts that are explicitly asking for advice where my product can directly address the request.',
    dm_prompt: campaign.dm_prompt || 'Write a DM promoting my product. Hi [recipient_first_name], I\'m from [product_name]. I saw your post about [post_reference]. [product_description] Check it out: [website]',
    website: campaign.website || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedCampaign = await api.updateCampaign(campaign.id, {
        ...campaign,
        ...formData
      })
      onUpdate(updatedCampaign)
      onClose()
    } catch (error) {
      console.error('Error updating campaign:', error)
      alert('Failed to update settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Prompts</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Prompt
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Instructions for AI on what kind of posts to find. Be specific about your target audience.
            </p>
            <textarea
              className="textarea h-32"
              value={formData.search_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, search_prompt: e.target.value }))}
              placeholder="Find posts where users are explicitly asking for advice on building websites..."
            />
          </div>

          {/* DM Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DM Template
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Template for generating direct messages. Use placeholders like [recipient_first_name], [post_reference], [product_name], [product_description], [website].
            </p>
            <textarea
              className="textarea h-32"
              value={formData.dm_prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, dm_prompt: e.target.value }))}
              placeholder="Hi [recipient_first_name], I saw your post about [post_reference]..."
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              className="input"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Placeholder Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Available Placeholders:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><code>[recipient_first_name]</code> - Reddit username</div>
              <div><code>[post_reference]</code> - Brief reference to their post</div>
              <div><code>[product_name]</code> - Your product name</div>
              <div><code>[product_description]</code> - Your product description</div>
              <div><code>[website]</code> - Your website URL</div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal 
import React, { useState, useEffect } from 'react'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import { api } from './services/api'

function App() {
  const [campaigns, setCampaigns] = useState([])
  const [currentCampaign, setCurrentCampaign] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const campaignsData = await api.getCampaigns()
      setCampaigns(campaignsData)
      if (campaignsData.length > 0) {
        setCurrentCampaign(campaignsData[0])
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignCreated = (campaign) => {
    setCampaigns(prev => [...prev, campaign])
    setCurrentCampaign(campaign)
  }

  const handleCampaignSelect = (campaign) => {
    setCurrentCampaign(campaign)
  }

  const handleNewCampaign = () => {
    setCurrentCampaign(null)
  }

  const handleCampaignDelete = (campaignId) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId))
    
    // If we deleted the current campaign, switch to another one
    if (currentCampaign?.id === campaignId) {
      const remainingCampaigns = campaigns.filter(c => c.id !== campaignId)
      if (remainingCampaigns.length > 0) {
        setCurrentCampaign(remainingCampaigns[0])
      } else {
        setCurrentCampaign(null)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Reddit Alerts...</p>
        </div>
      </div>
    )
  }

  if (!currentCampaign) {
    return <Onboarding onCampaignCreated={handleCampaignCreated} />
  }

  return (
    <Dashboard 
      campaign={currentCampaign} 
      campaigns={campaigns}
      onCampaignSelect={handleCampaignSelect}
      onNewCampaign={handleNewCampaign}
      onCampaignDelete={handleCampaignDelete}
    />
  )
}

export default App 
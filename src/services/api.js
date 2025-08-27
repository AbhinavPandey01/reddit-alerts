const API_BASE = '/api'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  // Campaign endpoints
  async getCampaigns() {
    return this.request('/campaigns')
  }

  async createCampaign(data) {
    return this.request('/campaigns', {
      method: 'POST',
      body: data,
    })
  }

  async updateCampaign(id, data) {
    return this.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  async getCampaign(id) {
    return this.request(`/campaigns/${id}`)
  }

  async deleteCampaign(id) {
    return this.request(`/campaigns/${id}`, {
      method: 'DELETE',
    })
  }

  // Reddit endpoints
  async getPosts(campaignId, filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.minRelevance) {
      params.append('minRelevance', filters.minRelevance)
    }
    
    if (filters.subreddit) {
      params.append('subreddit', filters.subreddit)
    }

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/reddit/posts/${campaignId}${query}`)
  }

  async generateResponse(postId, type) {
    return this.request(`/reddit/posts/${postId}/response`, {
      method: 'POST',
      body: { type },
    })
  }

  async getSubreddits(campaignId) {
    return this.request(`/reddit/subreddits/${campaignId}`)
  }

  async testRedditConnection() {
    return this.request('/reddit/test')
  }

  // Star/unstar endpoints
  async starPost(postId) {
    return this.request(`/reddit/posts/${postId}/star`, {
      method: 'POST',
    })
  }

  async unstarPost(postId) {
    return this.request(`/reddit/posts/${postId}/star`, {
      method: 'DELETE',
    })
  }

  async getStarredMatches(campaignId) {
    return this.request(`/reddit/campaigns/${campaignId}/starred`)
  }

  async getSubredditSuggestions(productName, description) {
    return this.request('/reddit/subreddit-suggestions', {
      method: 'POST',
      body: { product_name: productName, description: description }
    })
  }
}

export const api = new ApiService() 
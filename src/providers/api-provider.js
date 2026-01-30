import { BaseProvider } from './base-provider.js'

/**
 * Base class for API-based providers (Discord, Bluesky, Mailchimp)
 * Provides common HTTP client utilities and error handling
 */
export class ApiProvider extends BaseProvider {
  /**
   * Make an HTTP request to the provider's API
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint URL
   * @param {Object|null} body - Request body (will be JSON stringified)
   * @returns {Promise<Object>} Response data
   * @throws {Error} If request fails
   */
  async makeRequest(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.getHeaders()
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(endpoint, options)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return { success: true }
  }

  /**
   * Get HTTP headers for API requests
   * @returns {Object} HTTP headers
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    }
  }

  /**
   * Get authentication headers for API requests
   * Must be implemented by subclasses
   * @returns {Object} Authentication headers
   * @throws {Error} If not implemented by subclass
   */
  getAuthHeaders() {
    throw new Error(
      `${this.constructor.name}: getAuthHeaders() must be implemented`
    )
  }

  /**
   * Verify API connectivity and credentials
   * @returns {Promise<boolean>} True if verification succeeds
   */
  async verify() {
    try {
      await this.testConnection()
      return true
    } catch (error) {
      console.error(`${this.constructor.name} verification failed:`, error)
      return false
    }
  }

  /**
   * Test the API connection
   * Should be implemented by subclasses to hit a lightweight endpoint
   * @returns {Promise<void>}
   */
  async testConnection() {
    // Default implementation - subclasses should override
    console.warn(`${this.constructor.name}: testConnection() not implemented`)
  }
}

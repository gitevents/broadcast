/**
 * Abstract base class for all provider implementations
 * Defines the interface that all providers must implement
 */
export class BaseProvider {
  /**
   * @param {Object} eventData - Transformed event data for this provider
   * @param {Object} secrets - Provider-specific secrets (API keys, tokens, etc.)
   * @param {Object} config - Provider-specific configuration
   */
  constructor(eventData, secrets, config) {
    this.eventData = eventData
    this.secrets = secrets
    this.config = config
  }

  /**
   * Create a new event on the provider platform
   * @returns {Promise<Object>} Result with eventId and url
   * @throws {Error} If not implemented by subclass
   */
  async create() {
    throw new Error(`${this.constructor.name}: create() not implemented`)
  }

  /**
   * Update an existing event on the provider platform
   * @param {string} eventId - Provider's event ID
   * @returns {Promise<Object>} Result with updated eventId and url
   * @throws {Error} If not implemented by subclass
   */
  async update(eventId) {
    throw new Error(`${this.constructor.name}: update() not implemented`)
  }

  /**
   * Cancel an event on the provider platform
   * @param {string} eventId - Provider's event ID
   * @returns {Promise<Object>} Result confirming cancellation
   * @throws {Error} If not implemented by subclass
   */
  async cancel(eventId) {
    throw new Error(`${this.constructor.name}: cancel() not implemented`)
  }

  /**
   * Verify the provider connection and credentials
   * @returns {Promise<boolean>} True if verification succeeds
   * @throws {Error} If not implemented by subclass
   */
  async verify() {
    throw new Error(`${this.constructor.name}: verify() not implemented`)
  }
}

// src/executor.js
import { validateProviderConfig, capitalizeProvider } from './validation.js'
import {
  transformForDiscord,
  transformForBluesky,
  transformForMailchimp,
  transformForMeetup,
  transformForLuma
} from './transformer.js'

/**
 * Transform data for a specific provider
 * @param {string} provider - Provider name
 * @param {Object} eventData - Event data from fetcher
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Transformed payload
 */
async function transformForProvider(provider, eventData, config) {
  switch (provider) {
    case 'discord':
      return await transformForDiscord(eventData, config.discordTimeZone)
    case 'bluesky':
      return await transformForBluesky(eventData)
    case 'mailchimp':
      return await transformForMailchimp(eventData)
    case 'meetup':
      return await transformForMeetup(eventData)
    case 'luma':
      return await transformForLuma(eventData)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * Dispatch to provider (placeholder for actual API calls)
 * This will be called from the GitHub Actions workflow
 * @param {string} provider - Provider name
 * @param {string} lifecycleType - create, update, or cancel
 * @param {Object} payload - Transformed payload
 * @param {Object} config - Configuration object
 */
export async function dispatchToProvider(
  provider,
  lifecycleType,
  payload,
  config
) {
  // This is a no-op in the library
  // Actual dispatch happens in the workflow via existing provider logic
  // (Discord worker, Bluesky action, etc.)
  return { provider, lifecycleType, payload, config }
}

/**
 * Execute provider workflow with validation
 * @param {string} provider - Provider name
 * @param {Object} lifecycle - Lifecycle object { type, reason }
 * @param {Object} eventData - Event data from fetcher
 * @param {Object} config - Configuration object
 * @param {Function} dispatchFn - Optional dispatch function (for testing)
 * @returns {Promise<Object>} Result { success, provider, action/reason }
 */
export async function executeProvider(
  provider,
  lifecycle,
  eventData,
  config,
  dispatchFn = dispatchToProvider
) {
  // Validate required config
  const validation = validateProviderConfig(provider, config)
  if (!validation.valid) {
    return {
      success: false,
      provider: capitalizeProvider(provider),
      reason: `Missing required config: ${validation.missing.join(', ')}`
    }
  }

  try {
    // Transform data
    const payload = await transformForProvider(provider, eventData, config)

    // Execute provider logic
    await dispatchFn(provider, lifecycle.type, payload, config)

    return {
      success: true,
      provider: capitalizeProvider(provider),
      action:
        lifecycle.type === 'create'
          ? 'created'
          : lifecycle.type === 'update'
            ? 'updated'
            : 'cancelled'
    }
  } catch (error) {
    return {
      success: false,
      provider: capitalizeProvider(provider),
      reason: error.message
    }
  }
}

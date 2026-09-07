// Main entry point for GitEvents Broadcast
// Exports all modules for use in GitHub Actions workflows

// Data fetching
export { fetchEventData } from './fetcher.js'

// Lifecycle management
export {
  detectLifecycle,
  storeProviderEventIds,
  extractProviderEventIds,
  getProviderEventId,
  setProviderEventId
} from './lifecycle.js'

// Data transformation
export {
  transformForDiscord,
  transformForBluesky,
  transformForMailchimp,
  transformForMeetup,
  transformForLuma
} from './transformer.js'

// Provider base classes
export { BaseProvider } from './providers/base-provider.js'
export { ApiProvider } from './providers/api-provider.js'

// Provider implementations
export { DiscordProvider } from './providers/discord.js'
export { BlueskyProvider } from './providers/bluesky.js'
export { MailchimpProvider } from './providers/mailchimp.js'

// FormProvider, MeetupProvider and LumaProvider are intentionally not
// re-exported here. They depend on playwright, and re-exporting them makes the
// bundler pull a static `import "playwright"` into dist/index.js, which then
// fails to load anywhere playwright is not installed. Import them directly
// from './providers/form-provider.js', './providers/meetup.js' or
// './providers/luma.js' once those providers are implemented.

/**
 * Broadcast event to multiple providers
 * @param {Object} context - GitHub Actions context
 * @param {Object} options - Configuration options
 * @param {Object} options.providers - Provider enable flags { discord: true, bluesky: false, ... }
 * @param {Object} options.config - Provider configuration
 * @param {Function} fetchFn - Optional fetcher function (for testing)
 * @returns {Promise<Array>} Array of results per provider
 */
export async function broadcastMulti(context, options, fetchFn) {
  // Dynamic imports to avoid loading dependencies at module load time
  const { detectLifecycle } = await import('./lifecycle.js')
  const { fetchEventData } = await import('./fetcher.js')
  const { executeProvider } = await import('./executor.js')

  // Use provided fetchFn or default to fetchEventData
  const actualFetchFn = fetchFn || fetchEventData
  const { providers, config } = options

  // Detect lifecycle (create/update/cancel)
  const lifecycle = detectLifecycle(context)
  if (lifecycle.type === 'none') {
    return [{ success: true, provider: 'all', reason: 'No action needed' }]
  }

  // Fetch event data once (shared across all providers)
  const eventData = await actualFetchFn(context, {
    talksRepo: config.talksRepo || '',
    enrichSpeakers: false
  })

  // Process each enabled provider in parallel
  const providerPromises = []

  if (providers.discord) {
    providerPromises.push(
      executeProvider('discord', lifecycle, eventData, config).catch((err) => ({
        success: false,
        provider: 'Discord',
        reason: err.message
      }))
    )
  }

  if (providers.bluesky) {
    providerPromises.push(
      executeProvider('bluesky', lifecycle, eventData, config).catch((err) => ({
        success: false,
        provider: 'Bluesky',
        reason: err.message
      }))
    )
  }

  if (providers.mailchimp) {
    providerPromises.push(
      executeProvider('mailchimp', lifecycle, eventData, config).catch(
        (err) => ({
          success: false,
          provider: 'Mailchimp',
          reason: err.message
        })
      )
    )
  }

  if (providers.meetup) {
    providerPromises.push(
      executeProvider('meetup', lifecycle, eventData, config).catch((err) => ({
        success: false,
        provider: 'Meetup',
        reason: err.message
      }))
    )
  }

  if (providers.luma) {
    providerPromises.push(
      executeProvider('luma', lifecycle, eventData, config).catch((err) => ({
        success: false,
        provider: 'Luma',
        reason: err.message
      }))
    )
  }

  // Execute all in parallel, collect results
  const providerResults = await Promise.allSettled(providerPromises)

  return providerResults.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        success: false,
        provider: 'Unknown',
        reason: result.reason?.message || 'Unknown error'
      }
    }
  })
}

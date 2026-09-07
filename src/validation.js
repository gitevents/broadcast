// src/validation.js

/**
 * Validation requirements for each provider
 * Maps provider name to required config keys and their display names
 */
const PROVIDER_REQUIREMENTS = {
  discord: [
    { key: 'discordServerId', displayName: 'discord-server-id' },
    { key: 'discordTimeZone', displayName: 'discord-time-zone' }
  ],
  bluesky: [
    { key: 'bskyIdentifier', displayName: 'BSKY_IDENTIFIER' },
    { key: 'bskyPassword', displayName: 'BSKY_PASSWORD' }
  ],
  mailchimp: [{ key: 'mailchimpApiKey', displayName: 'MAILCHIMP_API_KEY' }],
  meetup: [
    { key: 'meetupEmail', displayName: 'MEETUP_EMAIL' },
    { key: 'meetupPassword', displayName: 'MEETUP_PASSWORD' }
  ],
  luma: [
    { key: 'lumaEmail', displayName: 'LUMA_EMAIL' },
    { key: 'lumaPassword', displayName: 'LUMA_PASSWORD' }
  ]
}

/**
 * Validate provider configuration
 * @param {string} provider - Provider name (discord, bluesky, etc.)
 * @param {Object} config - Configuration object with provider settings
 * @returns {Object} Validation result { valid: boolean, missing: string[] }
 */
export function validateProviderConfig(provider, config) {
  const requirements = PROVIDER_REQUIREMENTS[provider]

  if (!requirements) {
    throw new Error(`Unknown provider: ${provider}`)
  }

  const missing = []

  for (const req of requirements) {
    if (!config[req.key]) {
      missing.push(req.displayName)
    }
  }

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Capitalize provider name for display
 * @param {string} provider - Provider name (lowercase)
 * @returns {string} Capitalized provider name
 */
export function capitalizeProvider(provider) {
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

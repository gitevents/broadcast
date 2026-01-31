export const id = 58;
export const ids = [58];
export const modules = {

/***/ 52058:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  executeProvider: () => (/* binding */ executeProvider)
});

// UNUSED EXPORTS: dispatchToProvider

;// CONCATENATED MODULE: ./src/validation.js
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
function validateProviderConfig(provider, config) {
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
function capitalizeProvider(provider) {
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

// EXTERNAL MODULE: ./src/transformer.js + 155 modules
var transformer = __webpack_require__(87616);
;// CONCATENATED MODULE: ./src/executor.js
// src/executor.js



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
      return await (0,transformer/* transformForDiscord */.s2)(eventData, config.discordTimeZone)
    case 'bluesky':
      return await (0,transformer/* transformForBluesky */.Dy)(eventData)
    case 'mailchimp':
      return await (0,transformer/* transformForMailchimp */.ID)(eventData)
    case 'meetup':
      return await (0,transformer/* transformForMeetup */.y0)(eventData)
    case 'luma':
      return await (0,transformer/* transformForLuma */.nS)(eventData)
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
async function dispatchToProvider(
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
async function executeProvider(
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


/***/ })

};

//# sourceMappingURL=58.index.js.map
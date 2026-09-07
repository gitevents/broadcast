export const id = 350;
export const ids = [350];
export const modules = {

/***/ 20350:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   detectLifecycle: () => (/* binding */ detectLifecycle)
/* harmony export */ });
/* unused harmony exports storeProviderEventIds, extractProviderEventIds, getProviderEventId, setProviderEventId */
/**
 * Detect the lifecycle action based on issue labels and event type
 * @param {Object} context - GitHub Actions context
 * @returns {Object} Lifecycle information with type and reason
 */
function detectLifecycle(context) {
  const labels = (context.payload.issue.labels || []).map((l) => l.name)
  const action = context.payload.action
  const isCancelled = labels.some((l) => l.toLowerCase().includes('cancelled'))
  const isCreated = labels.some((l) => l.includes('Event Created'))

  // CANCEL: "Cancelled" label just added to an event that was broadcast.
  // Gated on the `labeled` action so later edits do not re-broadcast the
  // cancellation, and on "Event Created" so events that were never
  // broadcast are not cancelled on providers that never had them.
  if (
    action === 'labeled' &&
    context.payload.label?.name?.toLowerCase().includes('cancelled') &&
    isCreated
  ) {
    return { type: 'cancel', reason: 'Event cancelled' }
  }

  // A cancelled event is terminal: no further create or update broadcasts.
  if (isCancelled) {
    return { type: 'none', reason: 'Event is cancelled' }
  }

  // CREATE: "Approved" label added, no "Event Created" label yet
  if (
    action === 'labeled' &&
    context.payload.label?.name?.includes('Approved') &&
    !isCreated
  ) {
    return { type: 'create', reason: 'Event approved (first time)' }
  }

  // UPDATE: Has both "Approved" and "Event Created", issue edited
  if (
    action === 'edited' &&
    labels.some((l) => l.includes('Approved')) &&
    isCreated
  ) {
    return { type: 'update', reason: 'Event edited after creation' }
  }

  return { type: 'none', reason: 'No broadcast action needed' }
}

/**
 * Store provider event IDs in the issue body as an HTML comment
 * @param {string} issueBody - Current issue body content
 * @param {Object} providerIds - Map of provider names to their event IDs
 * @returns {string} Updated issue body with provider IDs
 */
function storeProviderEventIds(issueBody, providerIds) {
  const marker = '<!-- provider-ids: '
  const json = JSON.stringify(providerIds)
  // The GitHub API returns null for an issue with an empty body
  const body = typeof issueBody === 'string' ? issueBody : ''

  if (body.includes(marker)) {
    // Update existing marker
    return body.replace(/<!-- provider-ids: .*? -->/, `${marker}${json} -->`)
  } else {
    // Append new marker
    return `${body}\n\n${marker}${json} -->`
  }
}

/**
 * Extract provider event IDs from the issue body
 * @param {string} issueBody - Issue body content
 * @returns {Object} Map of provider names to their event IDs
 */
function extractProviderEventIds(issueBody) {
  // The GitHub API returns null for an issue with an empty body
  if (typeof issueBody !== 'string') {
    return {}
  }

  const match = issueBody.match(/<!-- provider-ids: (.*?) -->/)

  if (!match) {
    return {}
  }

  // A hand-edited or truncated marker must not break the whole broadcast
  try {
    const parsed = JSON.parse(match[1])
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (error) {
    console.warn(
      `Ignoring malformed provider-ids marker in issue body: ${error.message}`
    )
    return {}
  }
}

/**
 * Get the lifecycle action type for a given provider event ID
 * @param {string} issueBody - Issue body content
 * @param {string} provider - Provider name (e.g., 'discord', 'meetup')
 * @returns {string|null} Provider event ID or null if not found
 */
function getProviderEventId(issueBody, provider) {
  const providerIds = extractProviderEventIds(issueBody)
  return providerIds[provider] || null
}

/**
 * Set a provider event ID in the issue body
 * @param {string} issueBody - Current issue body content
 * @param {string} provider - Provider name
 * @param {string} eventId - Provider's event ID
 * @returns {string} Updated issue body
 */
function setProviderEventId(issueBody, provider, eventId) {
  const providerIds = extractProviderEventIds(issueBody)
  providerIds[provider] = eventId
  return storeProviderEventIds(issueBody, providerIds)
}


/***/ })

};

//# sourceMappingURL=350.index.js.map
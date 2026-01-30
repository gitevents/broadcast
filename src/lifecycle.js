/**
 * Detect the lifecycle action based on issue labels and event type
 * @param {Object} context - GitHub Actions context
 * @returns {Object} Lifecycle information with type and reason
 */
export function detectLifecycle(context) {
  const labels = context.payload.issue.labels.map((l) => l.name)
  const action = context.payload.action

  // CANCEL: Has "Cancelled" label
  if (labels.some((l) => l.toLowerCase().includes('cancelled'))) {
    return { type: 'cancel', reason: 'Event cancelled' }
  }

  // CREATE: "Approved" label added, no "Event Created" label yet
  if (
    action === 'labeled' &&
    context.payload.label?.name?.includes('Approved') &&
    !labels.some((l) => l.includes('Event Created'))
  ) {
    return { type: 'create', reason: 'Event approved (first time)' }
  }

  // UPDATE: Has both "Approved" and "Event Created", issue edited
  if (
    action === 'edited' &&
    labels.some((l) => l.includes('Approved')) &&
    labels.some((l) => l.includes('Event Created'))
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
export function storeProviderEventIds(issueBody, providerIds) {
  const marker = '<!-- provider-ids: '
  const json = JSON.stringify(providerIds)

  if (issueBody.includes(marker)) {
    // Update existing marker
    return issueBody.replace(
      /<!-- provider-ids: .*? -->/,
      `${marker}${json} -->`
    )
  } else {
    // Append new marker
    return `${issueBody}\n\n${marker}${json} -->`
  }
}

/**
 * Extract provider event IDs from the issue body
 * @param {string} issueBody - Issue body content
 * @returns {Object} Map of provider names to their event IDs
 */
export function extractProviderEventIds(issueBody) {
  const match = issueBody.match(/<!-- provider-ids: (.*?) -->/)
  return match ? JSON.parse(match[1]) : {}
}

/**
 * Get the lifecycle action type for a given provider event ID
 * @param {string} issueBody - Issue body content
 * @param {string} provider - Provider name (e.g., 'discord', 'meetup')
 * @returns {string|null} Provider event ID or null if not found
 */
export function getProviderEventId(issueBody, provider) {
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
export function setProviderEventId(issueBody, provider, eventId) {
  const providerIds = extractProviderEventIds(issueBody)
  providerIds[provider] = eventId
  return storeProviderEventIds(issueBody, providerIds)
}

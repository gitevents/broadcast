import bodyParser from '@zentered/issue-forms-body-parser'
import { zonedTimeToUtc } from 'date-fns-tz'
import { format, add } from 'date-fns'

/**
 * Transform event data for Discord scheduled events API
 * @param {Object} eventData - Event data from fetcher
 * @param {string} timezone - Event timezone (e.g., 'Europe/Nicosia')
 * @returns {Promise<Object>} Discord API payload
 */
export async function transformForDiscord(eventData, timezone) {
  const parsed = await bodyParser(eventData.body)

  const description = buildEventDescription(eventData, parsed)

  // Parse start time in the event's timezone
  const startTime = zonedTimeToUtc(
    `${parsed.date.date}T${parsed.time.time}`,
    timezone
  )

  // Calculate end time based on duration
  const endTime = calculateEndTime(parsed, timezone, startTime)

  return {
    name: eventData.title,
    description: description.slice(0, 1000), // Discord limit
    scheduled_start_time: startTime.toISOString(),
    scheduled_end_time: endTime.toISOString(),
    entity_type: 3, // External location
    entity_metadata: {
      location: parsed.location?.text || 'TBD'
    }
  }
}

/**
 * Transform event data for Bluesky posts
 * @param {Object} eventData - Event data from fetcher
 * @returns {Promise<Object>} Bluesky post data
 */
export async function transformForBluesky(eventData) {
  const parsed = await bodyParser(eventData.body)

  // Format as text post with talk list
  let text = `📅 ${eventData.title}\n`
  text += `📆 ${formatDate(parsed.date.date)} at ${parsed.time.time}\n`
  text += `📍 ${parsed.location?.text || 'TBD'}\n\n`

  if (eventData.talks && eventData.talks.length > 0) {
    text += `${eventData.talks.length} talk${eventData.talks.length > 1 ? 's' : ''} scheduled!\n\n`

    // Add first few talks inline (Bluesky has 300 char limit per post)
    const maxTalks = 3
    for (let i = 0; i < Math.min(eventData.talks.length, maxTalks); i++) {
      const talk = eventData.talks[i]
      const speaker = talk.author?.name || talk.author?.login || 'TBD'
      text += `🎤 ${talk.title} by ${speaker}\n`
    }

    if (eventData.talks.length > maxTalks) {
      text += `... and ${eventData.talks.length - maxTalks} more!\n`
    }
  }

  text += `\n🔗 ${eventData.url}`

  return {
    text: text.slice(0, 300), // Bluesky limit
    // Additional talks for potential threading
    talks: eventData.talks
      ? eventData.talks.map((talk) => ({
          text: `🎤 ${talk.title} by ${talk.author?.name || talk.author?.login || 'TBD'}`
        }))
      : []
  }
}

/**
 * Transform event data for Mailchimp campaigns (placeholder)
 * @param {Object} eventData - Event data from fetcher
 * @returns {Promise<Object>} Mailchimp campaign data (placeholder)
 */
export async function transformForMailchimp(eventData) {
  const parsed = await bodyParser(eventData.body)

  // TODO: Implement Mailchimp HTML template format
  return {
    subject: eventData.title,
    preheader: `Join us on ${formatDate(parsed.date.date)}`,
    html: '<h1>Placeholder - Mailchimp integration not yet implemented</h1>',
    // Pass through for future implementation
    eventData,
    parsed
  }
}

/**
 * Transform event data for Meetup form fields (placeholder)
 * @param {Object} eventData - Event data from fetcher
 * @returns {Promise<Object>} Meetup form data (placeholder)
 */
export async function transformForMeetup(eventData) {
  const parsed = await bodyParser(eventData.body)

  // TODO: Implement Meetup form field mapping
  return {
    title: eventData.title,
    description: parsed['event-description']?.text || '',
    date: parsed.date.date,
    time: parsed.time.time,
    location: parsed.location?.text || '',
    duration: parsed.duration?.text || '120', // Default 2 hours
    // Pass through for future implementation
    eventData,
    parsed
  }
}

/**
 * Transform event data for Luma form fields (placeholder)
 * @param {Object} eventData - Event data from fetcher
 * @returns {Promise<Object>} Luma form data (placeholder)
 */
export async function transformForLuma(eventData) {
  const parsed = await bodyParser(eventData.body)

  // TODO: Implement Luma form field mapping
  return {
    title: eventData.title,
    description: parsed['event-description']?.text || '',
    date: parsed.date.date,
    time: parsed.time.time,
    location: parsed.location?.text || '',
    // Pass through for future implementation
    eventData,
    parsed
  }
}

/**
 * Build a rich event description including talks
 * @param {Object} eventData - Event data
 * @param {Object} parsed - Parsed issue body
 * @returns {string} Formatted description
 */
function buildEventDescription(eventData, parsed) {
  let desc = parsed['event-description']?.text || ''

  if (eventData.talks && eventData.talks.length > 0) {
    desc += '\n\nTalks:\n'
    for (const talk of eventData.talks) {
      const speaker = talk.author?.name || talk.author?.login || 'TBD'
      desc += `• ${talk.title} by ${speaker}\n`
    }
  }

  return desc
}

/**
 * Calculate event end time based on duration
 * @param {Object} parsed - Parsed issue body
 * @param {string} timezone - Event timezone
 * @param {Date} startTime - Calculated start time
 * @returns {Date} End time
 */
function calculateEndTime(parsed, timezone, startTime) {
  const durationMinutes = parseInt(parsed.duration?.text || '120', 10)

  return add(startTime, { minutes: durationMinutes })
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

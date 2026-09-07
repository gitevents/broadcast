import bodyParser from '@zentered/issue-forms-body-parser'
import { zonedTimeToUtc } from 'date-fns-tz'
import { format, add, parseISO } from 'date-fns'

// Bluesky caps a post at 300 characters
const BLUESKY_MAX_LENGTH = 300

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
  const startTime = resolveStartTime(parsed, timezone)

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
  const { date, time } = requireDateAndTime(parsed)

  // Format as text post with talk list
  let text = `📅 ${eventData.title}\n`
  text += `📆 ${formatDate(date)} at ${time}\n`
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

  // The link is the point of the post, so reserve its length up front rather
  // than appending it and letting the 300-char truncation cut it off.
  const link = eventData.url ? `\n🔗 ${eventData.url}` : ''
  const available = BLUESKY_MAX_LENGTH - link.length

  if (text.length > available) {
    text = `${text.slice(0, Math.max(0, available - 1)).trimEnd()}…`
  }

  text += link

  return {
    text,
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
    preheader: parsed?.date?.date
      ? `Join us on ${formatDate(parsed.date.date)}`
      : 'Join us',
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
    date: parsed?.date?.date || '',
    time: parsed?.time?.time || '',
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
    date: parsed?.date?.date || '',
    time: parsed?.time?.time || '',
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
 * Read the Date and Time fields, failing clearly when either is absent
 * @param {Object} parsed - Parsed issue body
 * @returns {{date: string, time: string}} Date and time strings
 * @throws {Error} If either field is missing
 */
function requireDateAndTime(parsed) {
  const date = parsed?.date?.date
  const time = parsed?.time?.time

  if (!date || !time) {
    throw new Error(
      'Event issue is missing a Date or Time field; both are required'
    )
  }

  return { date, time }
}

/**
 * Resolve the event start time in the event's timezone
 * @param {Object} parsed - Parsed issue body
 * @param {string} timezone - Event timezone
 * @returns {Date} Start time
 * @throws {Error} If the date or time is missing or unparseable
 */
function resolveStartTime(parsed, timezone) {
  const { date, time } = requireDateAndTime(parsed)
  const startTime = zonedTimeToUtc(`${date}T${time}`, timezone)

  if (Number.isNaN(startTime.getTime())) {
    throw new Error(
      `Could not parse event start time from date "${date}" and time "${time}". Expected YYYY-MM-DD and HH:mm.`
    )
  }

  return startTime
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 * @throws {Error} If the date cannot be parsed
 */
function formatDate(dateStr) {
  // parseISO reads "2026-02-01" as local midnight. new Date() would read it as
  // UTC midnight, which formats as the previous day west of Greenwich.
  const date = parseISO(dateStr)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Could not parse event date "${dateStr}"`)
  }

  return format(date, 'MMM d, yyyy')
}

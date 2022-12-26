import core from '@actions/core'

const apiKey = process.env.EVENTBRITE_API_KEY
const organizationId = process.env.EVENTBRITE_ORG_ID

function createEventApiUrl(organizationId,eventId) {
  if( eventId ) {
  return `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/${eventId}`
} else {
    return `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`
  }
}

async function updateEvent(parsedContent) {
  const messageIdRegEx = new RegExp(/message=(\d+)/)
  const eventId = messageIdRegEx.exec(parsedContent['broadcast-by-git-events'].text)[1]
    const apiUrl = createEventApiUrl(organizationId,eventId)
    core.debug('Updating Event: ' + apiUrl)
    const eventsResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        event: {

        }
      }
    })
    const eventData = await eventsResponse.json()
    
}

async functon createEvent() {

}

/**
 * Fetch all events from Eventbrite, check if the event already exists and create or update it.
 *
 * @param {*} parsedContent
 * @param {*} context
 */
export default async function eventbrite(parsedContent, context) {
  
  if (
    parsedContent['broadcast-by-git-events'] &&
    parsedContent['broadcast-by-git-events'].text &&
    parsedContent['broadcast-by-git-events'].text.includes('Eventbrite')
  ) {
    // Eventbrite event found. Update event.
    updateEvent(parsedContent)
  }
}

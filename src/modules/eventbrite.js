function createEventApiUrl(organizationId) {
  return `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`
  // return 'https://www.eventbriteapi.com/v3/users/me/organizations/'
}

/**
 * Fetch all events from Eventbrite, check if the event already exists and create or update it.
 *
 * @param {*} parsedContent
 * @param {*} context
 */
export default async function eventbrite(parsedContent, context) {
  const organizationId = process.env.EVENTBRITE_ORG_ID
  const apiKey = process.env.EVENTBRITE_API_KEY

  const apiUrl = createEventApiUrl(organizationId)

  const eventsResponse = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  console.log(eventsResponse)
}
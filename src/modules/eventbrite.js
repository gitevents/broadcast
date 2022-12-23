function createEventApiUrl(organizationId) { 
  return `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`
}

export default eventbrite (parsedContent, context, options) {
  const { apiKey,organizationId } = options
  const apiUrl = createEventApiUrl(organizationId)
  

}

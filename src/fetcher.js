import { event, getUser } from '@gitevents/fetch'

/**
 * Fetch comprehensive event data including cross-repo talks
 * @param {Object} context - GitHub Actions context
 * @param {Object} options - Configuration options
 * @param {string} options.talksRepo - Cross-repo talks repository (format: "owner/repo")
 * @param {boolean} options.enrichSpeakers - Whether to fetch speaker profile data
 * @returns {Promise<Object>} Event data with talks and speakers
 */
export async function fetchEventData(context, options = {}) {
  const { owner, repo } = context.repo
  const issueNumber = context.payload.issue.number

  // @gitevents/fetch returns an array of events; a single issue yields one entry
  const [eventData] = await event(owner, repo, issueNumber)

  if (!eventData) {
    throw new Error(`Event not found: ${owner}/${repo}#${issueNumber}`)
  }

  // Handle cross-repo talks if configured
  if (options.talksRepo && eventData.talks && eventData.talks.length > 0) {
    eventData.talks = await fetchCrossRepoTalks(
      eventData.talks,
      options.talksRepo
    )
  }

  // Enrich speaker data if requested
  if (options.enrichSpeakers && eventData.talks) {
    for (const talk of eventData.talks) {
      if (talk.author?.login) {
        try {
          talk.author.profile = await getUser(talk.author.login)
        } catch (error) {
          // Gracefully handle missing user profiles
          console.warn(
            `Could not fetch profile for ${talk.author.login}:`,
            error.message
          )
        }
      }
    }
  }

  return eventData
}

/**
 * Fetch talks from a different repository
 * @param {Array} talks - Array of talk references from event
 * @param {string} talksRepoPath - Repository path (format: "owner/repo")
 * @returns {Promise<Array>} Array of enriched talk data
 */
async function fetchCrossRepoTalks(talks, talksRepoPath) {
  const enrichedTalks = []

  for (const talk of talks) {
    try {
      // Check if talk is a URL reference to another repo
      if (talk.url) {
        const talkData = await fetchTalkFromUrl(talk.url, talksRepoPath)
        enrichedTalks.push(talkData)
      } else {
        // Use existing talk data
        enrichedTalks.push(talk)
      }
    } catch (error) {
      console.warn(`Could not fetch talk ${talk.url}:`, error.message)
      // Include original talk data even if fetch fails
      enrichedTalks.push(talk)
    }
  }

  return enrichedTalks
}

/**
 * Fetch talk data from a GitHub issue URL
 * @param {string} url - GitHub issue URL
 * @param {string} talksRepoPath - Expected talks repository
 * @returns {Promise<Object>} Talk data
 */
async function fetchTalkFromUrl(url, talksRepoPath) {
  // Parse GitHub URL to extract owner/repo/issue
  // Format: https://github.com/owner/repo/issues/123
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/)

  if (!match) {
    throw new Error(`Invalid GitHub issue URL: ${url}`)
  }

  const [, owner, repo, issueNumber] = match

  // Verify it matches the expected talks repo if provided
  if (talksRepoPath) {
    const [expectedOwner, expectedRepo] = talksRepoPath.split('/')
    if (owner !== expectedOwner || repo !== expectedRepo) {
      console.warn(
        `Talk ${url} is from ${owner}/${repo} but expected ${talksRepoPath}`
      )
    }
  }

  // @gitevents/fetch returns an array; a single issue yields one entry
  const [talkData] = await event(owner, repo, parseInt(issueNumber, 10))

  if (!talkData) {
    throw new Error(`Talk not found: ${url}`)
  }

  return talkData
}

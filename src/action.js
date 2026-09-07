// Entry point for the composite GitHub Action (see action.yml).
//
// src/index.js is the library barrel and deliberately has no side effects, so
// it cannot serve as `runs.main`: loading it would make the action a silently
// passing no-op. This module is the executable wrapper around broadcastMulti.

import core from '@actions/core'
import github from '@actions/github'
import { broadcastMulti } from './index.js'

/**
 * Read a boolean action input, defaulting to false when unset
 * @param {string} name - Input name
 * @returns {boolean} Parsed value
 */
function getBooleanInput(name) {
  return core.getInput(name).toLowerCase() === 'true'
}

/**
 * Run the action: broadcast the triggering issue to every enabled provider
 * @returns {Promise<void>}
 */
export async function run() {
  const providers = {
    discord: getBooleanInput('enable-discord'),
    bluesky: getBooleanInput('enable-bluesky'),
    mailchimp: getBooleanInput('enable-mailchimp'),
    meetup: getBooleanInput('enable-meetup'),
    luma: getBooleanInput('enable-luma')
  }

  if (!Object.values(providers).some(Boolean)) {
    core.setFailed(
      'No providers enabled. Set at least one enable-* input to true.'
    )
    return
  }

  // Provider credentials are read from the environment so they are never
  // recorded in the workflow run's input log.
  const config = {
    discordServerId: core.getInput('discord-server-id'),
    discordTimeZone: core.getInput('discord-time-zone'),
    talksRepo: core.getInput('talks-repo'),
    bskyIdentifier: process.env.BSKY_IDENTIFIER,
    bskyPassword: process.env.BSKY_PASSWORD,
    mailchimpApiKey: process.env.MAILCHIMP_API_KEY,
    meetupEmail: process.env.MEETUP_EMAIL,
    meetupPassword: process.env.MEETUP_PASSWORD,
    lumaEmail: process.env.LUMA_EMAIL,
    lumaPassword: process.env.LUMA_PASSWORD
  }

  const results = await broadcastMulti(github.context, { providers, config })

  for (const result of results) {
    if (result.success) {
      core.info(`${result.provider}: ${result.action || result.reason}`)
    } else {
      // A provider missing its config is a skip, not a build failure, so this
      // warns rather than failing the job.
      core.warning(`${result.provider}: ${result.reason}`)
    }
  }

  core.setOutput('results', JSON.stringify(results))
}

run().catch((error) => {
  core.setFailed(error.message)
})

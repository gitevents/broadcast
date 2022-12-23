import core from '@actions/core'
import github from '@actions/github'
import { Octokit } from '@octokit/rest'
import { createAppAuth } from '@octokit/auth-app'
import bodyParser from '@zentered/issue-forms-body-parser'
import eventbrite from './modules/eventbrite.js'

async function run() {
  core.info('Starting GitEvents Broadcast...')
  const appId = core.getInput('gitevents-app-id')
  const appPrivateKey = core.getInput('gitevents-app-private-key')
  const appInstallationId = core.getInput('gitevents-app-installation-id')

  const enableEventbrite = core.getInput('enable-eventbrite')

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: appId,
      privateKey: appPrivateKey,
      installationId: appInstallationId
    }
  })
  const context = github.context

  const { data: appUser } = await octokit.rest.apps.getAuthenticated()
  const botUser = `${appUser.slug}[bot]`
  context.botUser = botUser

  if (context.eventName === 'issues') {
    const issueData = await bodyParser(context.payload.issue.body)

    if (enableEventbrite === 'true') {
      await eventbrite(issueData, context)
    }
  }
}

run()

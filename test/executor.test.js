// test/executor.test.js
'use strict'

import { test } from 'node:test'
import assert from 'node:assert'
import { executeProvider, dispatchToProvider } from '../src/executor.js'

test('executeProvider - returns success for valid Discord config', async () => {
  const lifecycle = { type: 'create' }
  const eventData = {
    title: 'Test Event',
    body: '### Date\n2026-02-01\n### Time\n18:00\n### Location\nOnline'
  }
  const config = {
    discordServerId: '123456',
    discordTimeZone: 'Europe/Nicosia'
  }

  // Mock dispatch function to avoid actual API calls
  const result = await executeProvider(
    'discord',
    lifecycle,
    eventData,
    config,
    async () => {} // Mock dispatch
  )

  assert.strictEqual(result.success, true)
  assert.strictEqual(result.provider, 'Discord')
  assert.strictEqual(result.action, 'created')
})

test('executeProvider - returns failure for missing Discord config', async () => {
  const lifecycle = { type: 'create' }
  const eventData = { title: 'Test Event', body: '' }
  const config = {} // Missing required config

  const result = await executeProvider(
    'discord',
    lifecycle,
    eventData,
    config,
    async () => {}
  )

  assert.strictEqual(result.success, false)
  assert.strictEqual(result.provider, 'Discord')
  assert.ok(result.reason.includes('Missing required config'))
})

test('executeProvider - maps lifecycle types to actions', async () => {
  const eventData = {
    title: 'Test',
    body: '### Date\n2026-02-01\n### Time\n18:00\n### Location\nOnline',
    url: 'https://github.com/test/repo/issues/1'
  }
  const config = {
    bskyIdentifier: 'user@bsky.social',
    bskyPassword: 'pass'
  }

  const createResult = await executeProvider(
    'bluesky',
    { type: 'create' },
    eventData,
    config,
    async () => {}
  )
  assert.strictEqual(createResult.action, 'created')

  const updateResult = await executeProvider(
    'bluesky',
    { type: 'update' },
    eventData,
    config,
    async () => {}
  )
  assert.strictEqual(updateResult.action, 'updated')

  const cancelResult = await executeProvider(
    'bluesky',
    { type: 'cancel' },
    eventData,
    config,
    async () => {}
  )
  assert.strictEqual(cancelResult.action, 'cancelled')
})

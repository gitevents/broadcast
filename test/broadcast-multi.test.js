// test/broadcast-multi.test.js
'use strict'

import { test } from 'node:test'
import assert from 'node:assert'
import { broadcastMulti } from '../src/index.js'

test('broadcastMulti - returns early if lifecycle is none', async () => {
  const context = {
    payload: {
      action: 'opened',
      issue: { number: 1, labels: [] }
    },
    repo: { owner: 'test', repo: 'test' }
  }

  const results = await broadcastMulti(context, {
    providers: { discord: true },
    config: {}
  })

  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].reason, 'No action needed')
})

test('broadcastMulti - executes single enabled provider', async () => {
  const context = {
    payload: {
      action: 'labeled',
      label: { name: 'Approved' },
      issue: {
        number: 1,
        title: 'Test Event',
        body: '### Date\n2026-02-01\n### Time\n18:00\n### Location\nOnline',
        labels: [{ name: 'Approved' }]
      }
    },
    repo: { owner: 'test', repo: 'test' }
  }

  // Mock fetchEventData to avoid actual API calls
  const results = await broadcastMulti(
    context,
    {
      providers: { discord: true, bluesky: false },
      config: {
        discordServerId: '123456',
        discordTimeZone: 'Europe/Nicosia'
      }
    },
    async () => ({ title: 'Test', body: context.payload.issue.body }) // Mock fetcher
  )

  assert.strictEqual(results.length, 1)
  assert.strictEqual(results[0].provider, 'Discord')
  assert.strictEqual(results[0].success, true)
})

test('broadcastMulti - executes multiple enabled providers in parallel', async () => {
  const context = {
    payload: {
      action: 'labeled',
      label: { name: 'Approved' },
      issue: {
        number: 1,
        title: 'Test Event',
        body: '### Date\n2026-02-01\n### Time\n18:00\n### Location\nOnline',
        labels: [{ name: 'Approved' }]
      }
    },
    repo: { owner: 'test', repo: 'test' }
  }

  const results = await broadcastMulti(
    context,
    {
      providers: { discord: true, bluesky: true },
      config: {
        discordServerId: '123456',
        discordTimeZone: 'Europe/Nicosia',
        bskyIdentifier: 'user@bsky.social',
        bskyPassword: 'pass'
      }
    },
    async () => ({
      title: 'Test',
      body: context.payload.issue.body,
      url: 'https://github.com/test/repo/issues/1'
    })
  )

  assert.strictEqual(results.length, 2)
  assert.ok(results.some((r) => r.provider === 'Discord'))
  assert.ok(results.some((r) => r.provider === 'Bluesky'))
})

test('broadcastMulti - handles provider failures gracefully', async () => {
  const context = {
    payload: {
      action: 'labeled',
      label: { name: 'Approved' },
      issue: {
        number: 1,
        title: 'Test Event',
        body: '### Date\n2026-02-01\n### Time\n18:00\n### Location\nOnline',
        labels: [{ name: 'Approved' }]
      }
    },
    repo: { owner: 'test', repo: 'test' }
  }

  const results = await broadcastMulti(
    context,
    {
      providers: { discord: true, bluesky: true },
      config: {
        // Discord missing config
        bskyIdentifier: 'user@bsky.social',
        bskyPassword: 'pass'
      }
    },
    async () => ({
      title: 'Test',
      body: context.payload.issue.body,
      url: 'https://github.com/test/repo/issues/1'
    })
  )

  assert.strictEqual(results.length, 2)
  const discordResult = results.find((r) => r.provider === 'Discord')
  const blueskyResult = results.find((r) => r.provider === 'Bluesky')

  assert.strictEqual(discordResult.success, false)
  assert.ok(discordResult.reason.includes('Missing required config'))
  assert.strictEqual(blueskyResult.success, true)
})

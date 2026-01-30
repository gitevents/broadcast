// test/validation.test.js
'use strict'

import { test } from 'node:test'
import assert from 'node:assert'
import {
  validateProviderConfig,
  capitalizeProvider
} from '../src/validation.js'

test('validateProviderConfig - Discord with valid config', () => {
  const result = validateProviderConfig('discord', {
    discordServerId: '123456',
    discordTimeZone: 'Europe/Nicosia'
  })
  assert.deepStrictEqual(result, { valid: true, missing: [] })
})

test('validateProviderConfig - Discord missing server-id', () => {
  const result = validateProviderConfig('discord', {
    discordTimeZone: 'Europe/Nicosia'
  })
  assert.strictEqual(result.valid, false)
  assert.deepStrictEqual(result.missing, ['discord-server-id'])
})

test('validateProviderConfig - Discord missing time-zone', () => {
  const result = validateProviderConfig('discord', {
    discordServerId: '123456'
  })
  assert.strictEqual(result.valid, false)
  assert.deepStrictEqual(result.missing, ['discord-time-zone'])
})

test('validateProviderConfig - Bluesky with valid credentials', () => {
  const result = validateProviderConfig('bluesky', {
    bskyIdentifier: 'user@bsky.social',
    bskyPassword: 'password'
  })
  assert.deepStrictEqual(result, { valid: true, missing: [] })
})

test('validateProviderConfig - Bluesky missing identifier', () => {
  const result = validateProviderConfig('bluesky', {
    bskyPassword: 'password'
  })
  assert.strictEqual(result.valid, false)
  assert.deepStrictEqual(result.missing, ['BSKY_IDENTIFIER'])
})

test('validateProviderConfig - Mailchimp with valid API key', () => {
  const result = validateProviderConfig('mailchimp', {
    mailchimpApiKey: 'api-key-123'
  })
  assert.deepStrictEqual(result, { valid: true, missing: [] })
})

test('validateProviderConfig - Meetup with valid credentials', () => {
  const result = validateProviderConfig('meetup', {
    meetupEmail: 'user@example.com',
    meetupPassword: 'password'
  })
  assert.deepStrictEqual(result, { valid: true, missing: [] })
})

test('validateProviderConfig - Luma with valid credentials', () => {
  const result = validateProviderConfig('luma', {
    lumaEmail: 'user@example.com',
    lumaPassword: 'password'
  })
  assert.deepStrictEqual(result, { valid: true, missing: [] })
})

test('capitalizeProvider - lowercases to Title Case', () => {
  assert.strictEqual(capitalizeProvider('discord'), 'Discord')
  assert.strictEqual(capitalizeProvider('bluesky'), 'Bluesky')
  assert.strictEqual(capitalizeProvider('mailchimp'), 'Mailchimp')
})

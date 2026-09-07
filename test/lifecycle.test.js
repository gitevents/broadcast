// test/lifecycle.test.js
'use strict'

import { test } from 'node:test'
import assert from 'node:assert'
import {
  detectLifecycle,
  extractProviderEventIds,
  storeProviderEventIds,
  getProviderEventId
} from '../src/lifecycle.js'

function context({ action, label, labels }) {
  return {
    payload: {
      action,
      label: label ? { name: label } : undefined,
      issue: { number: 1, labels: labels.map((name) => ({ name })) }
    }
  }
}

test('detectLifecycle - create when Approved is added and not yet created', () => {
  const result = detectLifecycle(
    context({ action: 'labeled', label: 'Approved', labels: ['Approved'] })
  )

  assert.strictEqual(result.type, 'create')
})

test('detectLifecycle - update when an already-created event is edited', () => {
  const result = detectLifecycle(
    context({ action: 'edited', labels: ['Approved', 'Event Created ✓'] })
  )

  assert.strictEqual(result.type, 'update')
})

test('detectLifecycle - cancel when Cancelled is added to a created event', () => {
  const result = detectLifecycle(
    context({
      action: 'labeled',
      label: 'Cancelled',
      labels: ['Approved', 'Event Created ✓', 'Cancelled']
    })
  )

  assert.strictEqual(result.type, 'cancel')
})

test('detectLifecycle - editing a cancelled issue does not re-fire cancel', () => {
  const result = detectLifecycle(
    context({
      action: 'edited',
      labels: ['Approved', 'Event Created ✓', 'Cancelled']
    })
  )

  assert.strictEqual(result.type, 'none')
})

test('detectLifecycle - cancelling an event that was never created is a no-op', () => {
  const result = detectLifecycle(
    context({ action: 'labeled', label: 'Cancelled', labels: ['Cancelled'] })
  )

  assert.strictEqual(result.type, 'none')
})

test('detectLifecycle - a cancelled event is not re-created by Approved', () => {
  const result = detectLifecycle(
    context({ action: 'labeled', label: 'Approved', labels: ['Cancelled'] })
  )

  assert.strictEqual(result.type, 'none')
})

test('extractProviderEventIds - returns {} for a null issue body', () => {
  // The GitHub API returns null for an issue with an empty body
  assert.deepStrictEqual(extractProviderEventIds(null), {})
  assert.deepStrictEqual(extractProviderEventIds(undefined), {})
})

test('extractProviderEventIds - returns {} for a malformed marker', () => {
  const body = 'Event\n\n<!-- provider-ids: {"discord": -->'

  assert.deepStrictEqual(extractProviderEventIds(body), {})
})

test('extractProviderEventIds - reads a well-formed marker', () => {
  const body = 'Event\n\n<!-- provider-ids: {"discord":"123"} -->'

  assert.deepStrictEqual(extractProviderEventIds(body), { discord: '123' })
  assert.strictEqual(getProviderEventId(body, 'discord'), '123')
})

test('storeProviderEventIds - tolerates a null issue body', () => {
  const body = storeProviderEventIds(null, { discord: '123' })

  assert.deepStrictEqual(extractProviderEventIds(body), { discord: '123' })
})

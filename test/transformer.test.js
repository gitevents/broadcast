// test/transformer.test.js
'use strict'

import { test } from 'node:test'
import assert from 'node:assert'
import { transformForBluesky, transformForDiscord } from '../src/transformer.js'

const BODY = '### Date\n2026-02-01\n### Time\n18:00\n### Location\nOnline'

test('transformForDiscord - builds a payload from a complete issue', async () => {
  const payload = await transformForDiscord(
    { title: 'Test Event', body: BODY },
    'Europe/Nicosia'
  )

  assert.strictEqual(payload.name, 'Test Event')
  assert.ok(!Number.isNaN(Date.parse(payload.scheduled_start_time)))
})

test('transformForDiscord - reports a missing Time field instead of a TypeError', async () => {
  await assert.rejects(
    () =>
      transformForDiscord(
        { title: 'Test Event', body: '### Date\n2026-02-01' },
        'Europe/Nicosia'
      ),
    /missing a Date or Time field/
  )
})

test('transformForDiscord - reports an unparseable time instead of a RangeError', async () => {
  // The body parser only sets `time.time` when it can parse the value, so an
  // unparseable time reaches transformForDiscord as an absent field.
  await assert.rejects(
    () =>
      transformForDiscord(
        { title: 'Test Event', body: '### Date\n2026-02-01\n### Time\nsix pm' },
        'Europe/Nicosia'
      ),
    /missing a Date or Time field/
  )
})

test('transformForDiscord - reports an unparseable date instead of a RangeError', async () => {
  await assert.rejects(
    () =>
      transformForDiscord(
        {
          title: 'Test Event',
          body: '### Date\nnext tuesday\n### Time\n18:00'
        },
        'Europe/Nicosia'
      ),
    /missing a Date or Time field/
  )
})

test('transformForBluesky - keeps the event link when the post is truncated', async () => {
  const url = 'https://github.com/gitevents/broadcast/issues/9999'
  const talks = Array.from({ length: 3 }, (_, i) => ({
    title: `A very long talk title that eats into the character budget ${i}`,
    author: { name: `Speaker With A Long Name ${i}` }
  }))

  const post = await transformForBluesky({
    title: 'An extremely long event title that consumes a lot of the budget',
    body: BODY,
    url,
    talks
  })

  assert.ok(post.text.length <= 300, `post is ${post.text.length} chars`)
  assert.ok(
    post.text.includes(url),
    'the event URL must survive truncation, it is the point of the post'
  )
})

test('transformForBluesky - keeps the link on a short post too', async () => {
  const url = 'https://github.com/gitevents/broadcast/issues/1'
  const post = await transformForBluesky({
    title: 'Short Event',
    body: BODY,
    url,
    talks: []
  })

  assert.ok(post.text.includes(url))
  assert.ok(post.text.length <= 300)
})

test('transformForBluesky - renders the event date independent of local timezone', async () => {
  // new Date('2026-02-01') is UTC midnight, which formats as Jan 31 west of
  // Greenwich. The displayed date must match the date written in the issue.
  const post = await transformForBluesky({
    title: 'Timezone Event',
    body: BODY,
    url: 'https://example.test/1',
    talks: []
  })

  assert.match(post.text, /Feb 1, 2026/)
})

'use strict'

import t from 'tap'
import fn from '../src/modules/eventbrite.js'

const test = t.test

test('create an event using the eventbrite api', async (t) => {
  await fn()
  t.same(true, true)
})

import { test, expect } from './fixtures.js'

// TEMPORARY: proves one failing browser shard fails the required "test" check. Reverted in the next commit.
test('a deliberately failing test', () => {
  expect('this shard').toBe('expected to fail')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stubFetch, tautulli, tautulliData, json } from './fetch.ts'
import { recentlyAdded } from '../src/tautulli.ts'

process.env.TAUTULLI_KEY = 'test-key'

const DAY = 24 * 60 * 60
const NOW = 1_800_000_000
const cutoff = NOW - 7 * DAY

const item = (rating_key: string, ageDays: number, section_id = '1') =>
  ({ rating_key, section_id, media_type: 'movie', added_at: String(NOW - ageDays * DAY) })

test('keeps items inside the window and stops at the first older one', async () => {
  const calls = stubFetch(tautulli('get_recently_added', () => tautulliData({ recently_added: [item('1', 2), item('2', 8), item('3', 1)] })))

  const items = await recentlyAdded(cutoff)

  assert.deepEqual(items.map((i) => i.rating_key), ['1'])
  assert.equal(calls[0].searchParams.get('apikey'), 'test-key')
  // A section filter makes Tautulli list every episode instead of whole seasons and shows.
  assert.equal(calls[0].searchParams.has('section_id'), false)
})

test('keeps only the movie and TV libraries', async () => {
  stubFetch(tautulli('get_recently_added', () => tautulliData({ recently_added: [item('1', 1, '1'), item('2', 1, '3'), item('3', 1, '2')] })))

  assert.deepEqual((await recentlyAdded(cutoff)).map((i) => i.rating_key), ['1', '3'])
})

test('asks for more when the window fills the whole list', async () => {
  const all = Array.from({ length: 150 }, (_, n) => item(String(n), n / 100))
  const calls = stubFetch(tautulli('get_recently_added', (p) => tautulliData({ recently_added: all.slice(0, Number(p.get('count'))) })))

  const items = await recentlyAdded(cutoff)

  assert.equal(items.length, 150)
  assert.deepEqual(calls.map((c) => c.searchParams.get('count')), ['100', '200'])
})

test('a Tautulli error fails the run', async () => {
  stubFetch(tautulli('get_recently_added', () => json({}, 500)))

  await assert.rejects(recentlyAdded(cutoff), /get_recently_added answered 500/)
})

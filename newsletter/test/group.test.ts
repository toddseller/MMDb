import { test } from 'node:test'
import assert from 'node:assert/strict'
import { group } from '../src/group.ts'
import type { Added } from '../src/tautulli.ts'

let clock = 2000
const at = () => String(clock--)
const movie = (key: string): Added => ({ rating_key: key, section_id: '1', media_type: 'movie', title: key, year: '1971', added_at: at() })
const show = (key: string): Added => ({ rating_key: key, section_id: '2', media_type: 'show', title: key, added_at: at() })
const season = (show: string, n: number): Added =>
  ({ rating_key: `${show}s${n}`, section_id: '2', parent_rating_key: show, parent_title: show, media_type: 'season', title: `Season ${n}`, media_index: String(n), added_at: at() })
const episode = (show: string, n: number): Added =>
  ({ rating_key: `${show}e${n}`, section_id: '2', parent_rating_key: `${show}s1`, grandparent_rating_key: show, grandparent_title: show, media_type: 'episode', title: `Ep ${n}`, added_at: at() })

const labels = (items: Added[]) => Object.fromEntries(group(items).shows.map((s) => [s.ratingKey, s.label]))

test('episodes of one show become one card that counts them', () => {
  const eight = Array.from({ length: 8 }, (_, n) => episode('tulsa', n))
  assert.deepEqual(labels([...eight, episode('lowdown', 1)]), { tulsa: '8 new episodes', lowdown: '1 new episode' })
})

test('seasons are named on the show card', () => {
  assert.deepEqual(labels([season('rings', 3)]), { rings: 'Season 3' })
  assert.deepEqual(labels([season('gilded', 3), season('gilded', 2)]), { gilded: 'Seasons 2 and 3' })
  assert.deepEqual(labels([season('x', 1), season('x', 3), season('x', 2)]), { x: 'Seasons 1, 2 and 3' })
})

test('a show added whole is a new series', () => {
  assert.deepEqual(labels([show('myth'), season('myth', 1), episode('myth', 1)]), { myth: 'New series' })
})

test('a season and episodes of another season are both mentioned', () => {
  assert.deepEqual(labels([season('dex', 2), episode('dex', 9), episode('dex', 10)]), { dex: 'Season 2, 2 new episodes' })
})

test('movies get their own cards, and each section lists the newest first', () => {
  const { movies, shows } = group([movie('carter'), episode('tulsa', 1), movie('primetime'), season('rings', 3), episode('tulsa', 2)])

  assert.deepEqual(movies.map((m) => [m.ratingKey, m.title, m.year]), [['carter', 'carter', '1971'], ['primetime', 'primetime', '1971']])
  assert.deepEqual(shows.map((s) => [s.ratingKey, s.title]), [['tulsa', 'tulsa'], ['rings', 'rings']])
})

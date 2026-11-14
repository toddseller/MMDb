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
const episode = (show: string, n: number, inSeason = 1): Added =>
  ({ rating_key: `${show}e${n}`, section_id: '2', parent_rating_key: `${show}s${inSeason}`, grandparent_rating_key: show, grandparent_title: show, media_type: 'episode', title: `Ep ${n}`, added_at: at() })

const labels = (items: Added[]) => Object.fromEntries(group(items).shows.map((s) => [s.ratingKey, s.label]))
const links = (items: Added[]) => Object.fromEntries(group(items).shows.map((s) => [s.ratingKey, s.linkKey]))

test('episodes of one show become one card that counts them', () => {
  const eight = Array.from({ length: 8 }, (_, n) => episode('tulsa', n))
  assert.deepEqual(labels([...eight, episode('lowdown', 1)]), { tulsa: '8 episodes', lowdown: '1 episode' })
})

test('a season added whole is a new season, however many', () => {
  assert.deepEqual(labels([season('rings', 3)]), { rings: 'New season' })
  assert.deepEqual(labels([season('gilded', 3), season('gilded', 2)]), { gilded: 'New season' })
  assert.deepEqual(labels([season('dex', 2), episode('dex', 9, 3), episode('dex', 10, 3)]), { dex: 'New season' })
})

test('a show added whole is a new series', () => {
  assert.deepEqual(labels([show('myth'), season('myth', 1), episode('myth', 1)]), { myth: 'New series' })
})

test('a card links to the show, the season added whole, or the newest episode\'s season', () => {
  assert.deepEqual(links([show('myth'), season('myth', 1)]), { myth: 'myth' })
  assert.deepEqual(links([season('rings', 3)]), { rings: 'ringss3' })
  assert.deepEqual(links([season('gilded', 3), season('gilded', 2)]), { gilded: 'gildeds3' })
  assert.deepEqual(links([episode('dex', 10, 3), season('dex', 2)]), { dex: 'dexs2' })
  assert.deepEqual(links([episode('tulsa', 9, 3), episode('tulsa', 2, 2)]), { tulsa: 'tulsas3' })
})

test('movies get their own cards, and each section lists the newest first', () => {
  const { movies, shows } = group([movie('carter'), episode('tulsa', 1), movie('primetime'), season('rings', 3), episode('tulsa', 2)])

  assert.deepEqual(movies.map((m) => [m.ratingKey, m.title, m.year]), [['carter', 'carter', '1971'], ['primetime', 'primetime', '1971']])
  assert.deepEqual(shows.map((s) => [s.ratingKey, s.title]), [['tulsa', 'tulsa'], ['rings', 'rings']])
})

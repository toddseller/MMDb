import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stubFetch, tautulli, tautulliData, json } from './fetch.ts'
import { cards } from '../src/cards.ts'
import type { Added } from '../src/tautulli.ts'

process.env.TAUTULLI_KEY = 'test-key'
process.env.TMDB_TOKEN = 'test-token'

const carter: Added = { rating_key: '134221', section_id: '1', media_type: 'movie', title: 'Get Carter', year: '1971', added_at: '9' }
const season3: Added = { rating_key: '133907', section_id: '2', media_type: 'season', title: 'Season 3', media_index: '3',
  parent_rating_key: '75801', parent_title: 'The Rings of Power', added_at: '8' }

const GUIDS: Record<string, string[]> = { '134221': ['imdb://tt0067128', 'tmdb://1485'], '75801': ['tmdb://84773'], '133907': ['tmdb://467821'] }

const plex = (guids = GUIDS) => [
  tautulli('get_server_identity', () => tautulliData({ machine_identifier: 'abc123' })),
  tautulli('get_metadata', (p) => tautulliData({ guids: guids[p.get('rating_key')!] ?? [] })),
]
const tmdb = (posters: Record<string, string>, backdrops: Record<string, string> = {}) => (url: URL, init: RequestInit) => {
  if (url.host !== 'api.themoviedb.org') return undefined
  assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer test-token')
  const path = posters[url.pathname]
  return path ? json({ poster_path: path, backdrop_path: backdrops[url.pathname] }) : json({}, 404)
}

test('a movie card has its title, year, TMDB poster and Plex link', async () => {
  stubFetch(...plex(), tmdb({ '/3/movie/1485': '/carter.jpg' }))

  const { hero, movies } = await cards([carter])

  assert.equal(hero, undefined)
  assert.deepEqual(movies, [{
    title: 'Get Carter', year: '1971',
    poster: 'https://image.tmdb.org/t/p/w342/carter.jpg',
    link: 'https://app.plex.tv/desktop/#!/server/abc123/details?key=%2Flibrary%2Fmetadata%2F134221',
  }])
})

test("a season's card uses the show's guid, poster and link, never the season's", async () => {
  const calls = stubFetch(...plex(), tmdb({ '/3/tv/84773': '/rings.jpg' }))

  const { shows } = await cards([season3])

  assert.equal(shows[0].poster, 'https://image.tmdb.org/t/p/w342/rings.jpg')
  assert.equal(shows[0].link, 'https://app.plex.tv/desktop/#!/server/abc123/details?key=%2Flibrary%2Fmetadata%2F75801')
  assert.deepEqual([shows[0].title, shows[0].label], ['The Rings of Power', 'Season 3'])
  assert.ok(!calls.some((c) => c.searchParams.get('rating_key') === '133907' || c.pathname.includes('467821')))
})

test('a title without a TMDB guid gets a card without a poster', async () => {
  stubFetch(...plex({ '134221': ['imdb://tt0067128'] }))

  const { movies } = await cards([carter])

  assert.equal(movies[0].title, 'Get Carter')
  assert.equal(movies[0].poster, undefined)
})

test('a TMDB or metadata error gets a card without a poster', async () => {
  stubFetch(...plex(), tmdb({}))
  assert.equal((await cards([carter])).movies[0].poster, undefined)

  stubFetch(tautulli('get_server_identity', () => tautulliData({ machine_identifier: 'abc123' })), tautulli('get_metadata', () => json({}, 500)))
  assert.equal((await cards([carter])).movies[0].poster, undefined)
})

test('the run fails when the server identity is unavailable', async () => {
  stubFetch(tautulli('get_server_identity', () => json({}, 500)))

  await assert.rejects(cards([carter]), /get_server_identity answered 500/)
})

const tulsa: Added = { rating_key: '106477', section_id: '2', media_type: 'episode', title: 'Dinosaurs',
  grandparent_rating_key: '106477', grandparent_title: 'Tulsa King', added_at: '20' }
const both = { ...GUIDS, '106477': ['tmdb://153312'] }

test('the newest addition with a backdrop becomes the hero and leaves its grid', async () => {
  stubFetch(...plex(both), tmdb({ '/3/movie/1485': '/carter.jpg', '/3/tv/153312': '/tulsa.jpg' }, { '/3/tv/153312': '/tulsa-wide.jpg' }))

  const { hero, movies, shows } = await cards([tulsa, carter])

  assert.equal(hero?.title, 'Tulsa King')
  assert.equal(hero?.kind, 'Series')
  assert.equal(hero?.label, '1 new episode')
  assert.equal(hero?.backdrop, 'https://image.tmdb.org/t/p/w780/tulsa-wide.jpg')
  assert.deepEqual(shows, [])
  assert.deepEqual(movies.map((m) => m.title), ['Get Carter'])
})

test('a movie can be the hero', async () => {
  stubFetch(...plex(both), tmdb({ '/3/movie/1485': '/carter.jpg', '/3/tv/153312': '/tulsa.jpg' }, { '/3/movie/1485': '/carter-wide.jpg' }))

  const { hero, movies, shows } = await cards([{ ...carter, added_at: '30' }, tulsa])

  assert.deepEqual([hero?.title, hero?.kind, hero?.year], ['Get Carter', 'Movie', '1971'])
  assert.deepEqual(movies, [])
  assert.equal(shows.length, 1)
})

test('without a backdrop for the newest addition there is no hero', async () => {
  stubFetch(...plex(both), tmdb({ '/3/movie/1485': '/carter.jpg', '/3/tv/153312': '/tulsa.jpg' }, { '/3/movie/1485': '/carter-wide.jpg' }))

  const { hero, shows } = await cards([tulsa, carter])

  assert.equal(hero, undefined)
  assert.equal(shows[0].title, 'Tulsa King')
})

test('the run fails when Tautulli answers without a server identity', async () => {
  stubFetch(tautulli('get_server_identity', () => tautulliData({})))

  await assert.rejects(cards([carter]), /Tautulli gave no server identity/)
})

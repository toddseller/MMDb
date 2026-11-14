import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stubFetch, tautulli, tautulliData, json } from './fetch.ts'
import { run } from '../src/run.tsx'

process.env.TAUTULLI_KEY = 'test-key'
process.env.TMDB_TOKEN = 'test-token'
process.env.RESEND_API_KEY = 're_test'
process.env.RESEND_SEGMENT_ID = 'segment-1'

const NOW = new Date('2026-11-15T00:00:00')
const recent = String(Math.floor(NOW.getTime() / 1000) - 3600)
const carter = { rating_key: '1', section_id: '1', media_type: 'movie', title: 'Get Carter', year: '1971', added_at: recent }

const plex = (added: unknown[]) => [
  tautulli('get_recently_added', () => tautulliData({ recently_added: added })),
  tautulli('get_server_identity', () => tautulliData({ machine_identifier: 'abc' })),
  tautulli('get_metadata', () => tautulliData({ guids: [] })),
]

type Broadcast = { segment_id: string, from: string, subject: string, html: string, send: boolean }

const resend = (sent: Broadcast[], status = 200) => (url: URL, init: RequestInit) => {
  if (url.host !== 'api.resend.com') return undefined
  assert.equal(`${init.method} ${url.pathname}`, 'POST /broadcasts')
  sent.push(JSON.parse(String(init.body)))
  return status === 200 ? json({ id: 'b1' }) : json({ name: 'restricted_api_key', message: 'This API key is restricted to only send emails' }, status)
}

test('a week with no additions sends nothing and writes nothing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'issues-'))
  const sent: Broadcast[] = []
  stubFetch(...plex([]), resend(sent))

  await run(NOW, dir)

  assert.deepEqual(sent, [])
  assert.deepEqual(await readdir(dir), [])
})

test('a normal week writes one page and sends one broadcast that links to it', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'issues-'))
  const sent: Broadcast[] = []
  stubFetch(...plex([carter]), resend(sent))

  await run(NOW, dir)

  const [page] = await readdir(dir)
  assert.match(page, /^2026-11-15-.{8}\.html$/)
  assert.equal(sent.length, 1)
  const [broadcast] = sent
  assert.equal(broadcast.segment_id, 'segment-1')
  assert.equal(broadcast.from, 'MYFLIX Newsletter <info@myflix.stream>')
  assert.equal(broadcast.subject, 'Recently added to MYFLIX (Nov 15, 2026)')
  assert.equal(broadcast.send, true)
  assert.ok(broadcast.html.includes(`href="https://myflix.stream/newsletter/${page}"`))
  assert.ok(broadcast.html.includes('{{{RESEND_UNSUBSCRIBE_URL}}}'))
  assert.ok(broadcast.html.includes('{{{contact.email}}}'))
  const web = await readFile(join(dir, page), 'utf8')
  assert.match(web, /Get Carter/)
  assert.doesNotMatch(web, /RESEND_UNSUBSCRIBE_URL|contact\.email/)
})

test('a December issue uses the Christmas template', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'issues-'))
  const sent: Broadcast[] = []
  const december = new Date('2026-12-13T00:00:00')
  stubFetch(...plex([{ ...carter, added_at: String(Math.floor(december.getTime() / 1000) - 3600) }]), resend(sent))

  await run(december, dir)

  assert.match(sent[0].html, /Fresh under the tree\./)
})

test('a page that cannot be saved stops the run before anything is sent', async () => {
  const sent: Broadcast[] = []
  stubFetch(...plex([carter]), resend(sent))

  await assert.rejects(run(NOW, '/nonexistent/issues'), /ENOENT/)
  assert.deepEqual(sent, [])
})

test('a refused broadcast fails the run', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'issues-'))
  stubFetch(...plex([carter]), resend([], 401))

  await assert.rejects(run(NOW, dir), /Resend refused the broadcast: This API key is restricted to only send emails/)
})

test('a late run still covers the week since the Sunday midnight before the last one', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'issues-'))
  const sent: Broadcast[] = []
  const mondayRerun = new Date('2026-11-16T09:00:00')
  const justAfterThePreviousSunday = String(new Date('2026-11-08T01:00:00').getTime() / 1000)
  stubFetch(...plex([{ ...carter, added_at: justAfterThePreviousSunday }]), resend(sent))

  await run(mondayRerun, dir)

  assert.equal(sent.length, 1)
  assert.match(sent[0].html, /Get Carter/)
})

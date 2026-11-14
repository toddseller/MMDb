import { test } from 'node:test'
import assert from 'node:assert/strict'
import { render } from '@react-email/components'
import Regular from '../src/emails/regular.tsx'
import Christmas from '../src/emails/christmas.tsx'
import type { IssueProps } from '../src/emails/_parts.tsx'

const issue: IssueProps = {
  date: 'November 15, 2026',
  movies: [{ title: 'Get Carter', year: '1971', poster: 'https://image.tmdb.org/t/p/w342/carter.jpg', link: 'https://app.plex.tv/desktop/#!/server/abc/details?key=%2Flibrary%2Fmetadata%2F1' }],
  shows: [{ title: 'Tulsa King', label: '8 episodes', link: 'https://app.plex.tv/desktop/#!/server/abc/details?key=%2Flibrary%2Fmetadata%2F2' }],
}
const VIEW = 'https://myflix.stream/newsletter/2026-11-15-abcdefgh.html'
const UNSUBSCRIBE = '{{{RESEND_UNSUBSCRIBE_URL}}}'
const RECIPIENT = '{{{contact.email}}}'

for (const [name, Template] of [['regular', Regular], ['christmas', Christmas]] as const) {
  test(`${name}: every card links into Plex and shows its poster when it has one`, async () => {
    const html = await render(<Template {...issue} />)

    assert.match(html, /Get Carter/)
    assert.match(html, /1971/)
    assert.match(html, /Tulsa King/)
    assert.match(html, /8 episodes/)
    assert.ok(html.includes('href="https://app.plex.tv/desktop/#!/server/abc/details?key=%2Flibrary%2Fmetadata%2F1"'))
    assert.ok(html.includes('href="https://app.plex.tv/desktop/#!/server/abc/details?key=%2Flibrary%2Fmetadata%2F2"'))
    assert.ok(html.includes('src="https://image.tmdb.org/t/p/w342/carter.jpg"'))
    assert.doesNotMatch(html, /Artwork from TMDB|Tap a title/)
    assert.equal(html.split('src="https://cdn.myflix.stream/avatars/myflix_m.png"').length - 1, 1, 'the M in the masthead')
    assert.equal(html.split('src="https://myflix.stream/images/logo_red.png"').length - 1, 1, 'the wordmark atop the footer')
    // Outlook ignores margin: auto on images but honours a centred table cell.
    assert.match(html, /<td align="center"[^>]*><img[^>]*src="https:\/\/myflix\.stream\/images\/logo_red\.png"/)
    assert.match(html, /Questions\? With Myflix, No Support Is The Best Support!/)
    assert.match(html, /Use of the Myflix service and website is subject to our Terms of Use and Privacy Statement\./)
  })

  test(`${name}: a show's label is a bar joined to the bottom of its poster`, async () => {
    const show = { title: 'Rings', label: 'New season', poster: 'https://image.tmdb.org/t/p/w342/rings.jpg', link: 'https://app.plex.tv/r' }
    const html = await render(<Template {...issue} shows={[show]} />)

    assert.match(html, /<img[^>]*src="https:\/\/image\.tmdb\.org\/t\/p\/w342\/rings\.jpg"[^>]*style="[^"]*border-radius:6px 6px 0 0/)
    assert.match(html, /<p[^>]*style="[^"]*border-radius:0 0 6px 6px[^"]*"[^>]*>New season<\/p>/)
  })

  test(`${name}: a movie ends in a Play bar joined to its poster`, async () => {
    const html = await render(<Template {...issue} />)

    assert.match(html, /src="https:\/\/image\.tmdb\.org\/t\/p\/w342\/carter\.jpg"[^>]*style="[^"]*border-radius:6px 6px 0 0/)
    // Outlook draws images at their declared size, so it matches the 178px column the other clients fill.
    assert.match(html, /<img alt="Get Carter" height="267" src="https:\/\/image\.tmdb\.org\/t\/p\/w342\/carter\.jpg"[^>]*width="178"/)
    assert.match(html, /<p[^>]*style="[^"]*border-radius:0 0 6px 6px;background:#[0-9a-f]{6}[^"]*"[^>]*>▶ Play<\/p>/)
  })

  test(`${name}: a show without a poster lines its grey tile up with its label bar`, async () => {
    const html = await render(<Template {...issue} shows={[{ title: 'Dexter', label: 'New season', link: 'https://app.plex.tv/d' }]} />)

    // A real image, because Outlook ignores the percentage padding a sized block would need.
    assert.match(html, /<img alt="Dexter" height="267" src="https:\/\/cdn\.myflix\.stream\/avatars\/no-poster\.png"[^>]*width="178"\/><p[^>]*>New season<\/p>/)
  })

  test(`${name}: grid columns keep equal widths whatever their titles`, async () => {
    const html = await render(<Template {...issue} />)

    assert.match(html, /<table[^>]*style="[^"]*table-layout:fixed/)
  })

  test(`${name}: the email copy links to its browser copy and to unsubscribe`, async () => {
    const html = await render(<Template {...issue} viewUrl={VIEW} unsubscribeUrl={UNSUBSCRIBE} recipient={RECIPIENT} />)

    assert.ok(html.includes(`href="${VIEW}"`))
    assert.match(html, /View in browser/)
    assert.match(html, new RegExp(`please <a href="\\{\\{\\{RESEND_UNSUBSCRIBE_URL\\}\\}\\}"[^>]*>click here to unsubscribe\\.</a>`))
    assert.match(html, /This message was mailed to \[\{\{\{contact\.email\}\}\}\] by Myflix\./)
    assert.match(html, /Please do not reply to this email/)
  })

  test(`${name}: the browser copy has neither link`, async () => {
    const html = await render(<Template {...issue} />)

    assert.doesNotMatch(html, /View in browser/)
    assert.doesNotMatch(html, /RESEND_UNSUBSCRIBE_URL|unsubscribe|mailed to|do not reply/i)
  })

  test(`${name}: a week with only movies has no TV section`, async () => {
    const html = await render(<Template {...issue} shows={[]} />)

    assert.match(html, /Movies/)
    assert.doesNotMatch(html, /TV Shows/)
  })

  test(`${name}: the hero shows its backdrop, chips and a Play button into Plex`, async () => {
    const hero = { title: 'Tulsa King', kind: 'Series' as const, label: '8 episodes', link: 'https://app.plex.tv/x',
      backdrop: 'https://image.tmdb.org/t/p/w780/tulsa.jpg' }
    const html = await render(<Template {...issue} hero={hero} />)

    assert.ok(html.includes('src="https://image.tmdb.org/t/p/w780/tulsa.jpg"'))
    assert.match(html, /Series/)
    assert.match(html, /Play in Plex/)
    assert.equal(html.split('href="https://app.plex.tv/x"').length - 1, 2)
    assert.match(html, /1 movie and 2 shows added/)
  })
}

test("the regular issue's Play bars are near-black", async () => {
  assert.match(await render(<Regular {...issue} />), /<p[^>]*style="[^"]*background:#221f1f[^"]*"[^>]*>▶ Play<\/p>/)
})

test("the Christmas issue's Play bars are pine green", async () => {
  const html = await render(<Christmas {...issue} />)

  assert.match(html, /<p[^>]*style="[^"]*background:#0b3d2c[^"]*"[^>]*>▶ Play<\/p>/)
})

test('the Christmas issue looks festive', async () => {
  const html = await render(<Christmas {...issue} />)

  assert.match(html, /Fresh under the tree\./)
  assert.match(html, /Happy holidays from MYFLIX/)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { render } from '@react-email/components'
import Regular from '../src/emails/regular.tsx'
import Christmas from '../src/emails/christmas.tsx'
import type { IssueProps } from '../src/emails/_parts.tsx'

const issue: IssueProps = {
  date: 'November 15, 2026',
  movies: [{ title: 'Get Carter', year: '1971', poster: 'https://image.tmdb.org/t/p/w342/carter.jpg', link: 'https://app.plex.tv/desktop/#!/server/abc/details?key=%2Flibrary%2Fmetadata%2F1' }],
  shows: [{ title: 'Tulsa King', label: '8 new episodes', link: 'https://app.plex.tv/desktop/#!/server/abc/details?key=%2Flibrary%2Fmetadata%2F2' }],
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
    assert.match(html, /8 new episodes/)
    assert.ok(html.includes('href="https://app.plex.tv/desktop/#!/server/abc/details?key=%2Flibrary%2Fmetadata%2F1"'))
    assert.ok(html.includes('href="https://app.plex.tv/desktop/#!/server/abc/details?key=%2Flibrary%2Fmetadata%2F2"'))
    assert.ok(html.includes('src="https://image.tmdb.org/t/p/w342/carter.jpg"'))
    assert.doesNotMatch(html, /Artwork from TMDB|Tap a title/)
    assert.match(html, /Questions\? With Myflix, No Support Is The Best Support!/)
    assert.match(html, /Use of the Myflix service and website is subject to our Terms of Use and Privacy Statement\./)
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
    const hero = { title: 'Tulsa King', kind: 'Series' as const, label: '8 new episodes', link: 'https://app.plex.tv/x',
      backdrop: 'https://image.tmdb.org/t/p/w780/tulsa.jpg' }
    const html = await render(<Template {...issue} hero={hero} />)

    assert.ok(html.includes('src="https://image.tmdb.org/t/p/w780/tulsa.jpg"'))
    assert.match(html, /Series/)
    assert.match(html, /Play in Plex/)
    assert.equal(html.split('href="https://app.plex.tv/x"').length - 1, 2)
    assert.match(html, /1 movie and 2 shows added/)
  })
}

test('the Christmas issue looks festive', async () => {
  const html = await render(<Christmas {...issue} />)

  assert.match(html, /Fresh under the tree\./)
  assert.match(html, /Happy holidays from MYFLIX/)
})

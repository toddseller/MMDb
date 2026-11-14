import { render } from '@react-email/components'
import { Resend } from 'resend'
import { cards } from './cards.ts'
import { choose } from './choose.ts'
import { isoDate, writePage } from './page.ts'
import { recentlyAdded } from './tautulli.ts'
import { HOLIDAYS, REGULAR } from './templates.ts'

// The week before the latest Sunday midnight, in local time: a late rerun or a catch-up after downtime then misses
// nothing since the last issue, and a daylight saving change neither skips nor repeats an hour.
const weekStart = (now: Date) => {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay() - 7)
  return start
}

export const run = async (now: Date, issuesDir: string) => {
  const items = await recentlyAdded(weekStart(now).getTime() / 1000)
  if (items.length === 0) {
    console.log('Nothing was added this week; no issue sent.')
    return
  }

  const issue = { ...await cards(items), date: now.toLocaleDateString('en-US', { dateStyle: 'long' }) }
  const Template = choose(now, REGULAR, HOLIDAYS)

  // Saved first, so an email never links to a page that failed to save.
  const page = await writePage(issuesDir, now, await render(<Template {...issue} />))
  const html = await render(<Template {...issue} viewUrl={`https://myflix.stream/newsletter/${page}`}
    unsubscribeUrl="{{{RESEND_UNSUBSCRIBE_URL}}}" recipient="{{{contact.email}}}" />)

  const { error } = await new Resend(process.env.RESEND_API_KEY).broadcasts.create({
    name: `Recently added ${isoDate(now)}`,
    segmentId: process.env.RESEND_SEGMENT_ID ?? '',
    from: 'MYFLIX Newsletter <info@myflix.stream>',
    subject: `Recently added to MYFLIX (${now.toLocaleDateString('en-US', { dateStyle: 'medium' })})`,
    html,
    send: true,
  })
  if (error) throw new Error(`Resend refused the broadcast: ${error.message}`)
  console.log(`Sent ${page}`)
}

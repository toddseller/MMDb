// Shared by every template; the leading underscore keeps the preview server from listing it as one.
import { Body, Button, Column, Container, Head, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components'
import type { ReactNode } from 'react'
import type { Card, Hero } from '../cards.ts'

export type IssueProps = {
  date: string
  hero?: Hero
  movies: Card[]
  shows: Card[]
  viewUrl?: string
  unsubscribeUrl?: string
  recipient?: string
}

// pageText is for the few words that sit on the page colour, outside the white column.
export type Theme = { page: string, pageText: string, surface: string, text: string, muted: string, accent: string, tile: string }

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const LOGO = 'https://myflix.stream/images/logo_red.png'

const PER_ROW = 3
const POSTER_WIDTH = 176
const POSTER_HEIGHT = 264

// Posters shrink with the column on a phone; this keeps a tile without one the same height as its neighbours.
const PhoneStyles = () => (
  <style>{'@media (max-width: 480px) { .no-art { height: 165px !important; } .footer { padding: 32px 20px 24px !important; } }'}</style>
)

const ViewInBrowser = ({ url, theme }: { url?: string, theme: Theme }) => url ? (
  <Text style={{ margin: 0, padding: '12px 0', textAlign: 'center', fontSize: 12 }}>
    <Link href={url} style={{ color: theme.pageText, textDecoration: 'underline' }}>View in browser</Link>
  </Text>
) : null

const Masthead = ({ date, theme, kicker = 'Recently added' }: { date: string, theme: Theme, kicker?: string }) => (
  <Section style={{ padding: '24px 20px 8px' }}>
    <Row>
      <Column width={110} valign="middle"><Img src={LOGO} alt="MYFLIX" width={96} height={31} /></Column>
      <Column valign="middle" style={{ paddingLeft: 14 }}>
        <Text style={{ margin: 0, fontSize: 16, fontWeight: 'bold', lineHeight: '20px', color: theme.text }}>{kicker}</Text>
        <Text style={{ margin: 0, fontSize: 13, lineHeight: '18px', color: theme.muted }}>{date}</Text>
      </Column>
    </Row>
  </Section>
)

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const Headline = ({ title, movies, shows, theme }: { title: string, movies: number, shows: number, theme: Theme }) => (
  <Section style={{ padding: '8px 20px 20px' }}>
    <Text style={{ margin: 0, fontSize: 34, fontWeight: 'bold', lineHeight: '40px', letterSpacing: -0.5, color: theme.text }}>{title}</Text>
    <Text style={{ margin: '10px 0 0', fontSize: 16, lineHeight: '22px', color: theme.text }}>
      {`${[movies && count(movies, 'movie', 'movies'), shows && count(shows, 'show', 'shows')].filter(Boolean).join(' and ')} added to MYFLIX this week.`}
    </Text>
  </Section>
)

const Chip = ({ children }: { children: string }) => (
  <span style={{ display: 'inline-block', margin: '0 4px 4px 0', padding: '3px 7px', borderRadius: 3, background: '#404040', color: '#ffffff', fontSize: 13 }}>
    {children}
  </span>
)

const HeroCard = ({ hero, theme }: { hero?: Hero, theme: Theme }) => hero ? (
  <Section style={{ padding: '0 20px 24px' }}>
    <Section style={{ background: '#000000', borderRadius: 8, overflow: 'hidden' }}>
      <Link href={hero.link}>
        <Img src={hero.backdrop} alt={hero.title} width={560} height={315} style={{ display: 'block', width: '100%', height: 'auto' }} />
      </Link>
      <Section style={{ padding: '16px 20px 20px' }}>
        <Text style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 'bold', color: '#ffffff' }}>{hero.title}</Text>
        <Text style={{ margin: '0 0 16px' }}>
          {[hero.year, hero.kind, hero.label].filter((c): c is string => !!c).map((c) => <Chip key={c}>{c}</Chip>)}
        </Text>
        <Button href={hero.link} style={{ display: 'block', padding: '12px 0', borderRadius: 4, background: theme.accent, color: '#ffffff',
          fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>▶&nbsp; Play in Plex</Button>
      </Section>
    </Section>
  </Section>
) : null

const rows = (cards: Card[]) =>
  Array.from({ length: Math.ceil(cards.length / PER_ROW) }, (_, n) => cards.slice(n * PER_ROW, (n + 1) * PER_ROW))

const Tile = ({ card, theme }: { card: Card, theme: Theme }) => (
  <Link href={card.link} style={{ color: theme.text, textDecoration: 'none' }}>
    {card.poster
      ? <Img src={card.poster} alt={card.title} width={POSTER_WIDTH} height={POSTER_HEIGHT}
          style={{ display: 'block', width: '100%', maxWidth: POSTER_WIDTH, height: 'auto', borderRadius: 6 }} />
      : <Section className="no-art" style={{ height: POSTER_HEIGHT, maxWidth: POSTER_WIDTH, background: theme.tile, borderRadius: 6 }}>
          <Text style={{ margin: 0, padding: '0 10px', fontSize: 15, fontWeight: 'bold', textAlign: 'center', color: theme.muted }}>{card.title}</Text>
        </Section>}
    {card.label && (
      <Text style={{ margin: '8px 0 0' }}>
        <span style={{ display: 'inline-block', padding: '3px 7px', borderRadius: 3, background: theme.accent, color: '#ffffff',
          fontSize: 11, fontWeight: 'bold', letterSpacing: 0.3, textTransform: 'uppercase' }}>{card.label}</span>
      </Text>
    )}
    <Text style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 'bold', lineHeight: '18px', color: theme.text }}>{card.title}</Text>
    {card.year && <Text style={{ margin: '2px 0 0', fontSize: 13, lineHeight: '17px', color: theme.muted }}>{card.year}</Text>}
  </Link>
)

const Cards = ({ heading, cards, theme }: { heading: string, cards: Card[], theme: Theme }) => cards.length === 0 ? null : (
  <Section style={{ padding: '0 14px 12px' }}>
    <Text style={{ margin: '0 6px 12px', fontSize: 22, fontWeight: 'bold', color: theme.text }}>{heading}</Text>
    {rows(cards).map((row, n) => (
      <Row key={n} style={{ marginBottom: 22 }}>
        {Array.from({ length: PER_ROW }, (_, i) => (
          <Column key={i} width="33%" valign="top" style={{ padding: '0 6px' }}>
            {row[i] && <Tile card={row[i]} theme={theme} />}
          </Column>
        ))}
      </Row>
    ))}
  </Section>
)

type FooterProps = { unsubscribeUrl?: string, recipient?: string }

const FOOTER_BG = '#262426'
const FOOTER_TEXT = '#b3b3b3'

// The lines about being emailed only make sense in the email; the browser copy leaves them out.
const Footer = ({ unsubscribeUrl, recipient }: FooterProps) => {
  const line = { margin: '0 0 16px', fontSize: 14, lineHeight: '20px', color: FOOTER_TEXT }
  return (
    <Section className="footer" style={{ background: FOOTER_BG, padding: '40px 48px 32px' }}>
      <Text style={line}>Questions? With Myflix, No Support Is The Best Support!</Text>
      {unsubscribeUrl && (
        <Text style={line}>
          This account email has been sent to you as part of your Myflix membership. If you would like to stop receiving these emails,
          please <Link href={unsubscribeUrl} style={{ color: FOOTER_TEXT, textDecoration: 'underline' }}>click here to unsubscribe.</Link>
        </Text>
      )}
      {unsubscribeUrl && <Text style={line}>Please do not reply to this email, as we are unable to respond from this email address.</Text>}
      {recipient && <Text style={line}>{`This message was mailed to [${recipient}] by Myflix.`}</Text>}
      <Text style={{ ...line, margin: 0 }}>Use of the Myflix service and website is subject to our Terms of Use and Privacy Statement.</Text>
    </Section>
  )
}

type LayoutProps = IssueProps & { theme: Theme, kicker?: string, headline: string, previewLead: string, banner?: ReactNode }

export const Layout = ({ theme, kicker, headline, previewLead, banner, date, hero, movies, shows, viewUrl, unsubscribeUrl, recipient }: LayoutProps) => (
  <Html lang="en">
    <Head>
      <PhoneStyles />
    </Head>
    <Preview>{`${previewLead} ${[...(hero ? [hero] : []), ...movies, ...shows].slice(0, 3).map((c) => c.title).join(', ')}`}</Preview>
    <Body style={{ margin: 0, background: theme.page, fontFamily: FONT }}>
      <ViewInBrowser url={viewUrl} theme={theme} />
      <Container style={{ maxWidth: 600, background: theme.surface }}>
        {banner}
        <Masthead date={date} kicker={kicker} theme={theme} />
        <Headline title={headline} movies={movies.length + (hero?.kind === 'Movie' ? 1 : 0)}
          shows={shows.length + (hero?.kind === 'Series' ? 1 : 0)} theme={theme} />
        <HeroCard hero={hero} theme={theme} />
        <Cards heading="Movies" cards={movies} theme={theme} />
        <Cards heading="TV Shows" cards={shows} theme={theme} />
        <Footer unsubscribeUrl={unsubscribeUrl} recipient={recipient} />
      </Container>
    </Body>
  </Html>
)

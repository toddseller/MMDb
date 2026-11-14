import { Layout, type IssueProps, type Theme } from './_parts.tsx'

const theme: Theme = { page: '#ebebeb', pageText: '#6d6d6e', surface: '#ffffff', text: '#221f1f', muted: '#6d6d6e', accent: '#e50914', playBar: '#221f1f' }

export default function Regular(props: IssueProps) {
  return <Layout {...props} theme={theme} headline="New this week." previewLead="New on MYFLIX:" />
}

Regular.PreviewProps = {
  date: 'November 15, 2026',
  hero: {
    title: 'Tulsa King', kind: 'Series', label: '8 episodes', link: '#',
    backdrop: 'https://image.tmdb.org/t/p/w780/mNHRGO1gFpR2CYZdANe72kcKq7G.jpg',
  },
  movies: [
    { title: 'Get Carter', year: '1971', poster: 'https://image.tmdb.org/t/p/w342/3AytAYzJuPmS4Wo8X3jcsaN4oM3.jpg', link: '#' },
    { title: 'Flight of the Phoenix', year: '2004', poster: 'https://image.tmdb.org/t/p/w342/pcj6unMsKCw0ogWFlUXmbc9gKap.jpg', link: '#' },
    { title: 'Primetime', year: '2025', link: '#' },
  ],
  shows: [
    { title: 'The Lord of the Rings: The Rings of Power', label: 'New season', poster: 'https://image.tmdb.org/t/p/w342/bMXWXKM9ydUmMTNvDnYo9QtCBRt.jpg', link: '#' },
    { title: 'MythBusters', label: 'New series', poster: 'https://image.tmdb.org/t/p/w342/lvRnMu00NLGiTPijGZg9CRF3nuY.jpg', link: '#' },
    { title: 'Dexter: Resurrection', label: 'New season', link: '#' },
  ],
  viewUrl: '#',
  unsubscribeUrl: '#',
  recipient: 'reader@example.com',
} satisfies IssueProps

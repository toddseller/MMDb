import { Section, Text } from '@react-email/components'
import { Layout, type IssueProps, type Theme } from './_parts.tsx'
import Regular from './regular.tsx'

const theme: Theme = { page: '#0b3d2c', pageText: '#cfe3d6', surface: '#fffaf3', text: '#221f1f', muted: '#6b6259', accent: '#c8102e', playBar: '#0b3d2c' }

const banner = (
  <Section style={{ background: theme.accent, padding: '10px 20px', textAlign: 'center' }}>
    <Text style={{ margin: 0, fontSize: 14, fontWeight: 'bold', letterSpacing: 1, color: '#ffffff' }}>
      ❄&nbsp; Happy holidays from MYFLIX &nbsp;❄
    </Text>
  </Section>
)

export default function Christmas(props: IssueProps) {
  return <Layout {...props} theme={theme} banner={banner} kicker="Holiday edition" headline="Fresh under the tree."
    previewLead="New on MYFLIX for the holidays:" />
}

Christmas.PreviewProps = { ...Regular.PreviewProps, date: 'December 13, 2026' } satisfies IssueProps

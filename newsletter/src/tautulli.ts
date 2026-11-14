import { getJson } from './http.ts'

export type Added = {
  rating_key: string
  section_id: string
  parent_rating_key?: string
  grandparent_rating_key?: string
  media_type: 'movie' | 'show' | 'season' | 'episode'
  title: string
  parent_title?: string
  grandparent_title?: string
  year?: string
  media_index?: string
  added_at: string
}

const call = async <T>(cmd: string, params: Record<string, string> = {}): Promise<T> => {
  const query = new URLSearchParams({ apikey: process.env.TAUTULLI_KEY ?? '', cmd, ...params })
  const body = await getJson<{ response: { data: T } }>(`https://plex.toddseller.dev/api/v2?${query}`, cmd)
  return body.response.data
}

const LIBRARIES = ['1', '2']

// Unfiltered, Tautulli collapses a whole season or show into one item; with section_id it lists every episode.
// Its start offset skips around on the unfiltered list, so ask for a longer list until it reaches past the cutoff.
export const recentlyAdded = async (cutoff: number) => {
  for (let count = 100; ; count *= 2) {
    const { recently_added: list } = await call<{ recently_added: Added[] }>('get_recently_added', { count: String(count) })
    const end = list.findIndex((item) => Number(item.added_at) < cutoff)
    if (end >= 0 || list.length < count) {
      return list.slice(0, end >= 0 ? end : undefined).filter((item) => LIBRARIES.includes(item.section_id))
    }
  }
}

export const metadata = (ratingKey: string) => call<{ guids?: string[] }>('get_metadata', { rating_key: ratingKey })

// Every Plex link needs this, so a missing one fails the run rather than sending dead links.
export const serverId = async () => {
  const { machine_identifier } = await call<{ machine_identifier?: string }>('get_server_identity')
  if (!machine_identifier) throw new Error('Tautulli gave no server identity')
  return machine_identifier
}

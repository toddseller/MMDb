import { getJson } from './http.ts'
import { group, type Group } from './group.ts'
import { metadata, serverId, type Added } from './tautulli.ts'

export type Card = { title: string, year?: string, label?: string, poster?: string, link: string }
export type Hero = Card & { kind: 'Movie' | 'Series', backdrop: string }

type Art = { poster?: string, backdrop?: string }

const tmdbArt = async (ratingKey: string, kind: 'movie' | 'tv'): Promise<Art> => {
  const { guids = [] } = await metadata(ratingKey)
  const id = guids.find((guid) => guid.startsWith('tmdb://'))?.slice('tmdb://'.length)
  if (!id) return {}
  const { poster_path, backdrop_path } = await getJson<{ poster_path?: string, backdrop_path?: string }>(
    `https://api.themoviedb.org/3/${kind}/${id}`, 'TMDB', { Authorization: `Bearer ${process.env.TMDB_TOKEN}`, Accept: 'application/json' })
  return {
    ...(poster_path && { poster: `https://image.tmdb.org/t/p/w342${poster_path}` }),
    ...(backdrop_path && { backdrop: `https://image.tmdb.org/t/p/w780${backdrop_path}` }),
  }
}

// One at a time, so a long week doesn't fire dozens of lookups at Tautulli at once and time out.
const toCards = async (groups: Group[], kind: 'movie' | 'tv', server: string) => {
  const result: (Card & Art)[] = []
  for (const { ratingKey, linkKey = ratingKey, ...rest } of groups) {
    const art = await tmdbArt(ratingKey, kind).catch(() => ({}))
    result.push({ ...rest, ...art,
      link: `https://app.plex.tv/desktop/#!/server/${server}/details?key=${encodeURIComponent(`/library/metadata/${linkKey}`)}` })
  }
  return result
}

export const cards = async (items: Added[]) => {
  const server = await serverId()
  const groups = group(items)
  const movies = await toCards(groups.movies, 'movie', server)
  const shows = await toCards(groups.shows, 'tv', server)
  const wide = [...movies.map((card) => ({ card, kind: 'Movie' as const })),
    ...shows.map((card) => ({ card, kind: 'Series' as const }))].filter(({ card }) => card.backdrop)
  // Any title with wide artwork can lead, so the hero varies from week to week.
  const pick = wide[Math.floor(Math.random() * wide.length)]
  if (!pick) return { hero: undefined, movies, shows }
  const list = pick.kind === 'Movie' ? movies : shows
  list.splice(list.indexOf(pick.card), 1)
  const hero: Hero = { ...pick.card, kind: pick.kind, backdrop: pick.card.backdrop! }
  return { hero, movies, shows }
}

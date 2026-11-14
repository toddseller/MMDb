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
  for (const { ratingKey, addedAt, ...rest } of groups) {
    const art = await tmdbArt(ratingKey, kind).catch(() => ({}))
    result.push({ ...rest, ...art,
      link: `https://app.plex.tv/desktop/#!/server/${server}/details?key=${encodeURIComponent(`/library/metadata/${ratingKey}`)}` })
  }
  return result
}

export const cards = async (items: Added[]) => {
  const server = await serverId()
  const groups = group(items)
  const movies = await toCards(groups.movies, 'movie', server)
  const shows = await toCards(groups.shows, 'tv', server)
  const movieIsNewest = (groups.movies[0]?.addedAt ?? -1) > (groups.shows[0]?.addedAt ?? -1)
  const [newest, rest] = movieIsNewest ? [movies[0], movies] : [shows[0], shows]
  // The newest addition leads the issue when it has wide artwork; otherwise the issue has no hero.
  const hero: Hero | undefined = newest?.backdrop ? { ...newest, kind: movieIsNewest ? 'Movie' : 'Series', backdrop: newest.backdrop } : undefined
  if (hero) rest.shift()
  return { hero, movies, shows }
}

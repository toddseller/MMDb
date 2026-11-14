import type { Added } from './tautulli.ts'

export type Group = { ratingKey: string, addedAt: number, title: string, year?: string, label?: string }

const showKey = (item: Added) =>
  item.media_type === 'season' ? item.parent_rating_key! :
  item.media_type === 'episode' ? item.grandparent_rating_key! : item.rating_key

const showTitle = (item: Added) =>
  item.media_type === 'season' ? item.parent_title! :
  item.media_type === 'episode' ? item.grandparent_title! : item.title

const list = (words: string[]) => words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`

const showLabel = (items: Added[]) => {
  if (items.some((i) => i.media_type === 'show')) return 'New series'
  const seasons = items.filter((i) => i.media_type === 'season').map((i) => Number(i.media_index)).sort((a, b) => a - b)
  const episodes = items.filter((i) => i.media_type === 'episode').length
  return [
    seasons.length && `${seasons.length > 1 ? 'Seasons' : 'Season'} ${list(seasons.map(String))}`,
    episodes && `${episodes} new episode${episodes > 1 ? 's' : ''}`,
  ].filter(Boolean).join(', ')
}

// Items arrive newest first, so first-seen order keeps each section newest first.
export const group = (items: Added[]) => {
  const shows = new Map<string, Added[]>()
  const movies: Group[] = []
  for (const item of items) {
    if (item.media_type === 'movie') movies.push({ ratingKey: item.rating_key, addedAt: Number(item.added_at), title: item.title, year: item.year })
    else shows.set(showKey(item), [...shows.get(showKey(item)) ?? [], item])
  }
  return { movies, shows: [...shows].map(([ratingKey, grouped]) => ({ ratingKey, addedAt: Number(grouped[0].added_at), title: showTitle(grouped[0]), label: showLabel(grouped) })) }
}

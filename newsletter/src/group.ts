import type { Added } from './tautulli.ts'

// linkKey is what the card opens in Plex when it isn't the title itself, such as a show's new season.
export type Group = { ratingKey: string, title: string, year?: string, label?: string, linkKey?: string }

const showKey = (item: Added) =>
  item.media_type === 'season' ? item.parent_rating_key! :
  item.media_type === 'episode' ? item.grandparent_rating_key! : item.rating_key

const showTitle = (item: Added) =>
  item.media_type === 'season' ? item.parent_title! :
  item.media_type === 'episode' ? item.grandparent_title! : item.title

// One short phrase, so the label bar stays on one line even on a phone. Items arrive newest first, so the first match
// is the newest: a new show beats a new season, which beats loose episodes, and the card links to what its label names.
const showCard = (items: Added[]) => {
  const whole = items.find((i) => i.media_type === 'show') ?? items.find((i) => i.media_type === 'season')
  if (whole) return { label: whole.media_type === 'show' ? 'New series' : 'New season', linkKey: whole.rating_key }
  return { label: items.length === 1 ? '1 episode' : `${items.length} episodes`, linkKey: items[0].parent_rating_key! }
}

// Items arrive newest first, so first-seen order keeps each section newest first.
export const group = (items: Added[]) => {
  const shows = new Map<string, Added[]>()
  const movies: Group[] = []
  for (const item of items) {
    if (item.media_type === 'movie') movies.push({ ratingKey: item.rating_key, title: item.title, year: item.year })
    else shows.set(showKey(item), [...shows.get(showKey(item)) ?? [], item])
  }
  return { movies, shows: [...shows].map(([ratingKey, grouped]) => ({ ratingKey, title: showTitle(grouped[0]), ...showCard(grouped) })) }
}

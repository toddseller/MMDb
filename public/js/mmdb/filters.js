// @ts-check
import { on } from '#mmdb/events.js'
import { request } from '#mmdb/request.js'
import { close as closeDrawer } from '#mmdb/drawer.js'
import { fadeIn } from '#mmdb/motion.js'

const SEARCH_PAUSE_MS = 300

// The text behind the list on screen, so a save or delete can ask the server to redraw that same list.
let query = ''

/** @param {string} value */
export const rememberQuery = (value) => { query = value }

/**
 * What the server needs to redraw the list on screen: a title filter while the search box has text, otherwise a credits name.
 * @param {Document} document
 * @returns {{ filter: string } | { name: string }}
 */
export const listQuery = (document) =>
  /** @type {HTMLInputElement | null} */ (document.getElementById('search-movie-title'))?.value ? { filter: query } : { name: query }

/** @param {Document} document */
const windowOf = (document) => /** @type {Window} */ (document.defaultView)

/** @param {Document} document @param {string} selector @param {string} markup */
const replaceContents = (document, selector, markup) => {
  const element = document.querySelector(selector)
  if (element) element.innerHTML = markup
}

/** @param {Document} document @param {number | string} count */
const showCount = (document, count) => {
  const footer = /** @type {HTMLElement | null} */ (document.querySelector('.footer'))
  if (!footer) return
  footer.textContent = `${count} Movies`
  fadeIn(footer)
}

/** @param {Document} document */
const search = async (document) => {
  const window = windowOf(document)
  const filter = /** @type {HTMLInputElement | null} */ (document.getElementById('search-movie-title'))?.value ?? ''
  rememberQuery(filter)
  const kind = document.getElementById('movie-list') ? 'movies' : 'shows'
  const id = document.querySelector('.index-preview')?.id || window.sessionStorage.getItem('id') || ''
  if (window.sessionStorage.getItem('id') !== id) window.sessionStorage.setItem('id', id)
  const { page, count } = await request(`/${kind}/filter?${new URLSearchParams({ filter, id })}`)
  replaceContents(document, '#movie-list', page)
  showCount(document, count)
}

/** @param {Document} document @param {Element} link @param {string} otherSelector */
const showOnly = async (document, link, otherSelector) => {
  link.classList.add('active')
  document.querySelector(otherSelector)?.classList.remove('active')
  replaceContents(document, '#movie-list', await request(link.getAttribute('href') ?? ''))
}

/** @param {Document} document */
const clear = async (document) => {
  const window = windowOf(document)
  const form = /** @type {HTMLFormElement | null} */ (document.getElementById('filter-input'))
  form?.reset()
  closeDrawer(true)
  document.getElementById('unwatched')?.classList.remove('active')
  document.getElementById('four-k')?.classList.remove('active')
  rememberQuery('')
  const { page, movie_count: count } = await request(`/users/${window.sessionStorage.getItem('id')}`)
  replaceContents(document, '#user-page', page)
  showCount(document, count)
}

/**
 * Binds the collection filters on the document, so they keep working after Clear replaces the page.
 * @param {Document} document
 */
export const init = (document) => {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let pending
  on(document, 'keyup', '#search-movie-title', () => {
    clearTimeout(pending)
    pending = setTimeout(() => search(document), SEARCH_PAUSE_MS)
  })
  on(document, 'click', '#unwatched', (event, link) => {
    event.preventDefault()
    showOnly(document, link, '#four-k')
  })
  on(document, 'click', '#four-k', (event, link) => {
    event.preventDefault()
    showOnly(document, link, '#unwatched')
  })
  on(document, 'click', '#clear-btn', () => clear(document))
  on(document, 'click', '#library', (event) => {
    event.preventDefault()
    clear(document)
  })
}

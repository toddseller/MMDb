// @ts-check
import { on, onSubmit } from '#mmdb/events.js'
import { request, fields } from '#mmdb/request.js'
import { fadeIn, slideDown, slideUp, stop } from '#mmdb/motion.js'
import { isOpen, openTile, keepOpen, close as closeDrawer } from '#mmdb/drawer.js'
import { hideArrows as hideScrollArrows, updateArrows as updateScrollArrows, scrollPage } from '#mmdb/scroll-arrows.js'

const OPEN_MS = 300
const CLOSE_AFTER_ADD_MS = 500
const CENTRED_RESULTS = 6
const SPREAD_EPISODES = 5

/** @typedef {'movies' | 'shows' | 'episodes'} Layout */
/** @typedef {{ panel?: string, dismiss?: string, arrows?: string, glyph?: string }} LayoutStyles */

// The inline values each layout had under jQuery; the stylesheet supplies the rest. Kept here so the responsive change reworks them in one place.
/** @type {Record<Layout, LayoutStyles>} */
const LAYOUT = {
  movies: { dismiss: 'top: 0' },
  shows: { panel: 'height: 300px' },
  episodes: { panel: 'height: 300px', arrows: 'height: 169px; top: 84px', glyph: 'line-height: 3.3em' },
}

// Static markup with no data in it.
const PLACEHOLDER = '<div class="preview-placeholder"><img src="/imgs/loading_image.svg" width="174"></div>'
const CREATE_NEW_SHOW = '<button type="submit" id="create-new" class="add-all"><span class="glyphicon glyphicon-plus"></span><p>Create New Show</p></button>'

/** @param {Document} document */
const parts = (document) => {
  /** @param {string} selector */
  const find = (selector) => /** @type {HTMLElement} */ (document.querySelector(selector))
  const movies = document.getElementById('movie-list') !== null
  return {
    movies,
    band: find('#search-boxes'),
    panel: find('#preview'),
    room: find('#panel-room'),
    dismiss: find('#dismiss'),
    left: find('#scroll-left'),
    right: find('#scroll-right'),
    search: find('#search'),
    add: find(movies ? '#add' : '#add-show'),
    list: find(movies ? '#movie-list' : '#show-list'),
    footer: /** @type {HTMLElement | null} */ (document.querySelector('.footer')),
  }
}

/** @param {HTMLElement} el */
const isShown = (el) => el.style.display !== 'none' && el.style.display !== ''

/** @param {HTMLElement} el */
const hide = (el) => { el.style.display = 'none' }

/** @param {Document} document @param {Layout} layout */
const applyLayout = (document, layout) => {
  const { panel, dismiss, left, right } = parts(document)
  const styles = LAYOUT[layout]
  const display = panel.style.display
  const justify = panel.style.justifyContent
  panel.style.cssText = styles.panel ?? ''
  Object.assign(panel.style, { display, justifyContent: justify })
  dismiss.style.cssText = `${styles.dismiss ?? ''}; display: ${dismiss.style.display || 'none'}`
  for (const arrow of [left, right]) {
    arrow.style.cssText = `${styles.arrows ?? ''}; display: ${arrow.style.display || 'none'}`
    const glyph = /** @type {HTMLElement | null} */ (arrow.querySelector('.glyphicon'))
    if (glyph) glyph.style.cssText = styles.glyph ?? ''
  }
}

// Scrolls by however far the page below the room moved: nothing where the browser's scroll anchoring already held it, the room's
// height where it has none (Safari).
/** @param {HTMLElement} room @param {string} display */
const setRoomKeepingPlace = (room, display) => {
  const below = /** @type {HTMLElement} */ (room.nextElementSibling)
  const before = below.getBoundingClientRect().top
  stop(room)
  room.style.display = display
  room.ownerDocument.defaultView?.scrollBy(0, below.getBoundingClientRect().top - before)
}

// At the top of the page the room slides with the panel; scrolled down, or closing at once, the posters on screen stay put.
/** @param {Document} document @param {number} height */
const openRoom = (document, height) => {
  const { room } = parts(document)
  room.style.height = `${height}px`
  if (document.defaultView?.scrollY === 0) slideDown(room, 'block', OPEN_MS)
  else setRoomKeepingPlace(room, 'block')
}

/** @param {Document} document @param {number} ms */
const closeRoom = (document, ms) => {
  const { room } = parts(document)
  // Pages without a search band have no room.
  if (!room || !isShown(room)) return
  if (document.defaultView?.scrollY === 0 && ms > 0) slideUp(room, ms)
  else setRoomKeepingPlace(room, 'none')
}

/** @param {Document} document @param {string} display @param {(panel: HTMLElement) => void} fill */
const showPanel = (document, display, fill) => {
  const { band, panel, dismiss } = parts(document)
  const opening = !isShown(panel)
  const before = band.offsetHeight
  fill(panel)
  panel.style.display = display
  // A band in the page flow, as on a phone, already pushes the posters down; only the pinned one covers them.
  if (opening && document.defaultView?.getComputedStyle(band).position === 'fixed') openRoom(document, band.offsetHeight - before)
  if (opening) slideDown(panel, display, OPEN_MS)
  dismiss.style.display = 'block'
}

/** @param {Document} document @param {string} text @param {string} display */
const loading = (document, text, display) => {
  showPanel(document, display, (panel) => {
    const box = document.createElement('div')
    box.id = 'loading'
    const heading = document.createElement('h3')
    heading.textContent = text
    const spinner = document.createElement('div')
    spinner.className = 'loader'
    box.append(heading, spinner)
    panel.replaceChildren(box)
    panel.style.justifyContent = 'center'
  })
  hideArrows(document)
}

/** @param {Document} document */
const hideArrows = (document) => hideScrollArrows(parts(document).left, parts(document).right)

/** @param {Document} document */
const updateArrows = (document) => { const { panel, left, right } = parts(document); updateScrollArrows(panel, left, right) }

/** @param {Document} document @param {string} html @param {boolean} spread */
const showResults = (document, html, spread) => {
  showPanel(document, 'flex', (panel) => {
    panel.innerHTML = html
    panel.style.justifyContent = spread ? 'space-between' : 'center'
  })
  updateArrows(document)
}

// Searches go to Apple and TMDB and can take seconds: only the latest one may fill the panel, and closing it drops any still running.
let latestSearch = 0

/** @param {Document} document @param {string} url @param {Layout} layout */
export const search = async (document, url, layout) => {
  const mine = ++latestSearch
  applyLayout(document, layout)
  loading(document, 'Searching Our Database...', 'flex')
  try {
    const { query, page } = await request(url)
    if (mine === latestSearch) showResults(document, page, query.length > CENTRED_RESULTS)
  } catch {
    if (mine === latestSearch) showResults(document, layout === 'movies' ? PLACEHOLDER : CREATE_NEW_SHOW, false)
  }
}

/** @param {Document} document @param {number} [ms] */
export const close = (document, ms = OPEN_MS) => {
  latestSearch++
  const { panel, dismiss, search, add } = parts(document)
  if (isShown(panel)) slideUp(panel, ms)
  closeRoom(document, ms)
  hideArrows(document)
  for (const el of [dismiss, search]) hide(el)
  // A visitor's page has no add button.
  if (add) add.style.display = ''
}

/** @param {Document} document @param {HTMLFormElement} form */
const post = (document, form) => {
  const body = fields(form)
  body.append('filter', /** @type {HTMLInputElement | null} */ (document.getElementById('search-movie-title'))?.value ?? '')
  return request(form.getAttribute('action') ?? '', { method: 'POST', body })
}

/** @param {HTMLFormElement} form @param {string} field */
const value = (form, field) => /** @type {HTMLInputElement | null} */ (form.querySelector(`input[name="${field}"]`))?.value ?? ''

/** @param {Document} document @param {HTMLFormElement} form @param {string} title */
const adding = (document, form, title) => {
  loading(document, `Adding ${title} to Your Collection...`, 'block')
  return post(document, form)
}

/** @param {Document} document @param {string} page @param {string} count @param {(redraw: () => void) => void} [around] */
const showCollection = (document, page, count, around = (redraw) => redraw()) => {
  close(document, CLOSE_AFTER_ADD_MS)
  const { list, footer } = parts(document)
  around(() => { list.innerHTML = page })
  if (footer) footer.textContent = count
}

/** @param {Document} document @param {HTMLFormElement} form */
const addMovie = async (document, form) => {
  const response = await adding(document, form, value(form, 'movie[title]'))
  if (response.status !== 'true') return
  showCollection(document, response.page, `${response.movie_count} Movies`)
  const { footer } = parts(document)
  if (footer) fadeIn(footer)
}

/** @param {Document} document @param {HTMLFormElement} form */
const pickSeason = async (document, form) => {
  const response = await adding(document, form, value(form, 'show[title]'))
  if (response.status !== 'true') return
  applyLayout(document, 'episodes')
  showResults(document, response.page, response.count >= SPREAD_EPISODES)
}

/** @param {Document} document @param {HTMLFormElement} form */
const addEpisodes = async (document, form) => {
  const button = form.querySelector('button[type="submit"]')
  const title = button?.querySelector(':scope > span.glyphicon') ? `Season ${button.id}` : value(form, 'episode[title]')
  const response = await adding(document, form, title)
  if (response.status !== 'true') return
  // Fetched before the page changes, so the open drawer is never seen gone while its new details load.
  const tile = isOpen() ? openTile() : null
  const details = tile && await request(`/users/${tile.id}/shows/${tile.querySelector(':scope > a')?.id}`).catch(() => null)
  if (tile && !details) closeDrawer(true)
  // A drawer switched to another show while the details loaded keeps its own content.
  const html = tile && openTile() === tile ? details : undefined
  showCollection(document, response.page, `${response.show_count} TV Shows \u2014 ${response.episode_count} Episodes`,
    (redraw) => keepOpen(redraw, html, CLOSE_AFTER_ADD_MS))
}

/** @param {Document} document @param {HTMLFormElement} form */
const searchFrom = (document, form) => {
  const url = `/${form.id === 'movie-search' ? 'movies' : 'shows'}?${fields(form)}`
  form.reset()
  search(document, url, parts(document).movies ? 'movies' : 'shows')
}

/**
 * Binds adding to the collection: the add buttons, both searches, the add forms and the panel's controls.
 * @param {Document} document
 */
export const init = (document) => {
  on(document, 'click', '#add, #add-show', (_event, button) => {
    hide(/** @type {HTMLElement} */ (button))
    parts(document).search.style.display = 'block'
  })
  on(document, 'submit', '#movie-search, #show-search', onSubmit(searchFrom, document))
  on(document, 'submit', '#create-movie', onSubmit(addMovie, document))
  on(document, 'submit', '#create-show', onSubmit(pickSeason, document))
  on(document, 'submit', '#create-episode', onSubmit(addEpisodes, document))
  on(document, 'click', '#dismiss', (event) => {
    event.preventDefault()
    close(document)
  })
  on(document, 'click', '#scroll-left', () => scrollPage(parts(document).panel, -1))
  on(document, 'click', '#scroll-right', () => scrollPage(parts(document).panel, 1))
  // scroll doesn't bubble, so it's caught on the way down; the panel itself is replaced when Clear re-renders the page.
  document.addEventListener('scroll', (event) => { if (/** @type {Element} */ (event.target).id === 'preview') updateArrows(document) }, true)
}

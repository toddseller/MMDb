// @ts-check
import { on } from '#mmdb/events.js'
import { request } from '#mmdb/request.js'
import { fadeIn, fadeOut, slideDown, slideUp } from '#mmdb/motion.js'

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
const PLACEHOLDER = '<div style="width: 174px"><img src="/imgs/loading_image.svg" width="174"></div>'
const CREATE_NEW_SHOW = '<button type="submit" id="create-new" class="add-all"><span class="glyphicon glyphicon-plus"></span><p>Create New Show</p></button>'

/** @param {Document} document */
const parts = (document) => {
  /** @param {string} selector */
  const find = (selector) => /** @type {HTMLElement} */ (document.querySelector(selector))
  const movies = document.getElementById('movie-list') !== null
  return {
    movies,
    panel: find('#preview'),
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

/** @param {Document} document @param {string} display @param {(panel: HTMLElement) => void} fill */
const showPanel = (document, display, fill) => {
  const { panel, dismiss } = parts(document)
  const opening = !isShown(panel)
  fill(panel)
  if (opening) slideDown(panel, display, OPEN_MS)
  else panel.style.display = display
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

// What each arrow is meant to show; its display can't say, since a fading-out arrow still reads as shown.
/** @type {WeakMap<HTMLElement, boolean>} */
const arrowShown = new WeakMap()

/** @param {Document} document */
const hideArrows = (document) => {
  for (const arrow of [parts(document).left, parts(document).right]) {
    arrowShown.set(arrow, false)
    hide(arrow)
  }
}

/** @param {Document} document */
const updateArrows = (document) => {
  const { panel, left, right } = parts(document)
  /** @param {HTMLElement} arrow @param {boolean} wanted */
  const toggle = (arrow, wanted) => {
    if (wanted === (arrowShown.get(arrow) ?? false)) return
    arrowShown.set(arrow, wanted)
    if (wanted) fadeIn(arrow, 'block')
    else fadeOut(arrow)
  }
  toggle(left, panel.scrollLeft > 0)
  toggle(right, panel.scrollLeft + panel.clientWidth < panel.scrollWidth - 1)
}

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
const search = async (document, url, layout) => {
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

/** @param {Document} document @param {number} ms */
const close = (document, ms) => {
  latestSearch++
  const { panel, dismiss, search, add } = parts(document)
  if (isShown(panel)) slideUp(panel, ms)
  hideArrows(document)
  for (const el of [dismiss, search]) hide(el)
  add.style.display = ''
}

// The form's own window's FormData, since the constructor rejects forms from another window (as in the tests).
/** @param {HTMLFormElement} form */
const fields = (form) => {
  const { FormData } = /** @type {Window & typeof globalThis} */ (form.ownerDocument.defaultView)
  return new URLSearchParams(/** @type {any} */ (new FormData(form)))
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

/** @param {Document} document @param {string} page @param {string} count */
const showCollection = (document, page, count) => {
  close(document, CLOSE_AFTER_ADD_MS)
  const { list, footer } = parts(document)
  list.innerHTML = page
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
  showCollection(document, response.page, `${response.show_count} TV Shows \u2014 ${response.episode_count} Episodes`)
}

/** @param {(document: Document, form: HTMLFormElement) => void} handler @param {Document} document */
const onSubmit = (handler, document) => /** @param {Event} event @param {Element} form */ (event, form) => {
  event.preventDefault()
  handler(document, /** @type {HTMLFormElement} */ (form))
}

/** @param {Document} document @param {HTMLFormElement} form */
const searchFrom = (document, form) => {
  const url = `/${form.id === 'movie-search' ? 'movies' : 'shows'}?${fields(form)}`
  form.reset()
  search(document, url, parts(document).movies ? 'movies' : 'shows')
}

/** @param {Document} document @param {number} direction */
const scroll = (document, direction) => {
  const { panel } = parts(document)
  const reduced = document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  panel.scrollBy({ left: direction * panel.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
}

/**
 * Binds adding to the collection: the add buttons, both searches, the add forms and the panel's controls.
 * Lends the panel to the jQuery edit form's search and Create New Show until they move.
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
    close(document, OPEN_MS)
  })
  on(document, 'click', '#scroll-left', () => scroll(document, -1))
  on(document, 'click', '#scroll-right', () => scroll(document, 1))
  // scroll doesn't bubble, so it's caught on the way down; the panel itself is replaced when Clear re-renders the page.
  document.addEventListener('scroll', (event) => { if (/** @type {Element} */ (event.target).id === 'preview') updateArrows(document) }, true)
  const window = /** @type {Window} */ (document.defaultView)
  window.preview = {
    search: (url) => search(document, url, 'movies'),
    close: () => close(document, OPEN_MS),
  }
}

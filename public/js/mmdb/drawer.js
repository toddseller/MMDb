// @ts-check
import { on } from '#mmdb/events.js'
import { request } from '#mmdb/request.js'
import { fadeIn, fadeOut } from '#mmdb/motion.js'
import { close as closePanel } from '#mmdb/preview.js'
import { placeSeasons } from '#mmdb/season-row.js'

// The longest drawer transition (.35s) plus slack, for when no transitionend arrives.
const DRAWER_MS = 450
// .info.open's margin-top in drawer.css, which a drawer still easing open has yet to add below its row.
const OPEN_MARGIN = 20
const REDUCED = '(prefers-reduced-motion: reduce)'
const TILES = '.index-preview, .index-preview-show'

/** @type {HTMLElement | null} */
let current = null
/** @type {HTMLElement | null} */
let drawer = null

/** @param {Node} node */
const windowOf = (node) => /** @type {Window} */ (node.ownerDocument?.defaultView)

/** @param {Document} document @param {(el: HTMLElement) => void} fade */
const fadeFooters = (document, fade) => document.querySelectorAll('.footer').forEach((el) => fade(/** @type {HTMLElement} */ (el)))

// Runs done once, when el's transition on property ends or, if none runs (reduced motion, older browsers), after DRAWER_MS.
/** @param {HTMLElement} el @param {string} property @param {() => void} done */
const afterTransition = (el, property, done) => {
  let finished = false
  /** @param {TransitionEvent} event */
  const onEnd = (event) => { if (event.target === el && event.propertyName === property) finish() }
  const finish = () => {
    if (finished) return
    finished = true
    el.removeEventListener('transitionend', onEnd)
    done()
  }
  el.addEventListener('transitionend', onEnd)
  setTimeout(finish, DRAWER_MS)
}

// A drawer closing above the clicked row pulls the row up as it shrinks; scrolling by the same amount each frame keeps the poster still.
/** @param {HTMLElement} tile @param {number} top @param {number} [ms] @param {() => void} [done] */
const holdStill = (tile, top, ms = DRAWER_MS, done) => {
  const window = windowOf(tile)
  const until = Date.now() + ms
  const step = () => {
    const moved = tile.getBoundingClientRect().top - top
    if (moved) window.scrollBy(0, moved)
    if (Date.now() < until) window.requestAnimationFrame(step)
    else done?.()
  }
  window.requestAnimationFrame(step)
}

/**
 * Glides the page just far enough that the open drawer's bottom, once it has finished easing, clears the pinned footer,
 * never taking its poster under the pinned header. Only a drawer being opened may glide the page up to its poster:
 * anything else could pull a reader partway down a tall drawer back to the top.
 * @param {boolean} [up] @param {number} [height] the content's height once eased, when it is easing to a known one
 */
export const reveal = (up = false, height) => {
  if (!isOpen() || !current || !drawer) return
  const window = windowOf(current)
  const wrapper = /** @type {HTMLElement} */ (drawer.querySelector('.info-wrapper'))
  const margin = parseFloat(window.getComputedStyle(drawer).marginTop) || 0
  const end = wrapper.getBoundingClientRect().top + (height ?? wrapper.scrollHeight) + OPEN_MARGIN - margin
  // The tiles' scroll-margin-top is the pinned header's height, kept for the letter rail's jumps.
  const top = current.getBoundingClientRect().top - (parseFloat(window.getComputedStyle(current).scrollMarginTop) || 0)
  const footer = current.ownerDocument.querySelector('footer')?.getBoundingClientRect()
  const floor = footer?.height ? footer.top : window.innerHeight
  const by = top < 0 ? (up ? top : 0) : Math.max(0, Math.min(end - floor, top))
  if (by) window.scrollBy({ top: by, behavior: window.matchMedia?.(REDUCED).matches ? 'auto' : 'smooth' })
}

// Filters and updates re-render the list wholesale, which takes an open drawer with it.
export const isOpen = () => drawer !== null && drawer.isConnected

export const openTile = () => current

// Rows come from where tiles sit, so the drawer lands right at any width and with tiles hidden.
/** @param {HTMLElement} tile */
export const rowEnd = (tile) => {
  let end = tile
  for (let next = tile.nextElementSibling; next; next = next.nextElementSibling) {
    const candidate = /** @type {HTMLElement} */ (next)
    if (!candidate.matches(TILES) || candidate.offsetParent === null) continue
    if (candidate.offsetTop !== tile.offsetTop) break
    end = candidate
  }
  return end
}

/** @param {HTMLElement} tile */
const mark = (tile) => {
  current?.classList.remove('open')
  current = tile
  tile.classList.add('open')
}

// An image already on screen fills the poster's box until the poster arrives. It stays if the poster fails, which
// beats a broken image, and goes once it loads so it can't show around a poster of another shape. A poster with no src
// never loads, so it gets none: the image would stay as if it were this one's.
/** @param {Element} content @param {string | null | undefined} src */
export const placehold = (content, src) => {
  const poster = /** @type {HTMLElement | null} */ (content.querySelector('.description-poster img'))
  if (!poster?.getAttribute('src') || !src) return
  // A quoted CSS string, so a stored URL can't end the value early.
  poster.style.backgroundImage = `url(${JSON.stringify(src)})`
  poster.addEventListener('load', () => { poster.style.backgroundImage = '' }, { once: true })
}

/** @param {HTMLElement} tile */
const tileImage = (tile) => tile.querySelector('img')?.getAttribute('src')

/** @param {HTMLElement} tile @param {string} html @param {boolean} [instant] */
const insert = (tile, html, instant = false) => {
  const document = tile.ownerDocument
  const el = document.createElement('div')
  el.className = 'info'
  const wrapper = document.createElement('div')
  wrapper.className = 'info-wrapper'
  wrapper.innerHTML = html
  placehold(wrapper, tileImage(tile))
  el.append(wrapper)
  rowEnd(tile).after(el)
  placeSeasons(wrapper)
  mark(tile)
  drawer = el
  fadeFooters(document, fadeOut)
  if (instant) return el.classList.add('open')
  // Reading the height commits the closed state, so adding .open animates instead of appearing at once.
  void el.offsetHeight
  windowOf(tile).requestAnimationFrame(() => el.classList.add('open'))
}

// An instant open is a reload after a save, where the owner may be reading partway down the drawer.
/** @param {HTMLElement} tile @param {string} html @param {boolean} [instant] */
export const open = (tile, html, instant = false) => {
  insert(tile, html, instant)
  reveal(!instant)
}

/** @param {boolean} [instant] */
export const close = (instant = false) => {
  current?.classList.remove('open')
  const el = drawer
  current = null
  drawer = null
  if (!el) return
  fadeFooters(el.ownerDocument, fadeIn)
  if (instant) return el.remove()
  el.classList.remove('open')
  afterTransition(el, 'grid-template-rows', () => el.remove())
}

// keep is for the same show's details, so its season line stays where the owner left it.
/** @param {HTMLElement} tile @param {string} html @param {boolean} [keep] */
const swap = (tile, html, keep = false) => {
  const wrapper = /** @type {HTMLElement} */ (drawer?.querySelector('.info-wrapper'))
  const from = wrapper.offsetHeight
  const kept = keep ? wrapper.querySelector('#season-default')?.scrollLeft : undefined
  wrapper.style.height = `${from}px`
  wrapper.innerHTML = html
  placehold(wrapper, tileImage(tile))
  placeSeasons(wrapper, kept)
  const to = wrapper.scrollHeight
  mark(tile)
  if (from === to) {
    wrapper.style.height = ''
    return to
  }
  void wrapper.offsetHeight
  wrapper.style.height = `${to}px`
  afterTransition(wrapper, 'height', () => { wrapper.style.height = '' })
  return to
}

/** @param {HTMLElement} tile @param {string} html */
export const show = (tile, html) => {
  if (!isOpen() || !current) {
    current = null
    drawer = null
    return open(tile, html)
  }
  if (rowEnd(tile) === rowEnd(current)) return reveal(false, swap(tile, html))
  const top = tile.getBoundingClientRect().top
  close()
  insert(tile, html)
  // Gliding during the hold would fight it, so the drawer is brought into view once the old one has closed.
  holdStill(tile, top, DRAWER_MS, () => reveal(true))
}

// Redrawing the list takes the open drawer with it. This moves the same drawer under its poster's new tile, so it is
// never seen gone, and eases it to the new details. ms covers anything else moving the poster, such as a panel closing.
/** @param {() => void} redraw @param {string} [html] @param {number} [ms] */
export const keepOpen = (redraw, html, ms) => {
  const el = isOpen() ? drawer : null
  const tile = current
  const id = tile?.querySelector(':scope > a')?.id
  if (!el || !tile || !id) return redraw()
  const list = /** @type {HTMLElement} */ (tile.parentElement)
  const top = tile.getBoundingClientRect().top
  el.remove()
  redraw()
  // Tiles carry the user's id and poster links the show's or movie's, so the poster is found by its link.
  const moved = /** @type {HTMLElement | null} */ (list.querySelector(`:scope > * > a[id="${id}"]`)?.parentElement ?? null)
  if (!moved || moved.offsetParent === null) return close(true)
  rowEnd(moved).after(el)
  if (html === undefined) mark(moved)
  else swap(moved, html, true)
  holdStill(moved, top, ms, () => reveal())
}

/** @param {Document} document @param {Element} poster */
const togglePoster = async (document, poster) => {
  const tile = /** @type {HTMLElement} */ (poster.parentElement)
  if (isOpen() && current === tile) return close()
  // An edit search's results update the movie they were searched for, so they can't stay up under another movie. At once,
  // so the page under the panel has settled before the drawer measures the poster.
  closePanel(document, 0)
  const kind = document.getElementById('movie-list') ? 'movies' : 'shows'
  show(tile, await request(`/users/${tile.id}/${kind}/${poster.id}`))
}

/**
 * Binds the poster clicks.
 * @param {Document} document
 */
export const init = (document) => {
  const window = /** @type {Window} */ (document.defaultView)
  // Turning a phone changes how many posters fit a row. The drawer leaves the grid first, as its own row would end the
  // poster's row early and hide where that row now ends. iPhone Safari also resizes as its address bar moves during a
  // scroll; that changes only the height, and moving the drawer then would cost a layout of the grid and drop focus.
  let width = window.innerWidth
  window.addEventListener('resize', () => {
    if (window.innerWidth === width) return
    width = window.innerWidth
    if (!isOpen() || !current || !drawer) return
    const el = drawer
    el.remove()
    rowEnd(current).after(el)
  })
  for (const poster of ['.movie-modal', '.show-modal']) {
    on(document, 'click', poster, (event, link) => {
      event.preventDefault()
      togglePoster(document, link)
    })
  }
}

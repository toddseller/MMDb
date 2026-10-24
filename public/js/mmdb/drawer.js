// @ts-check
import { on } from '#mmdb/events.js'
import { request } from '#mmdb/request.js'
import { fadeIn, fadeOut } from '#mmdb/motion.js'
import { close as closePanel } from '#mmdb/preview.js'

// The longest drawer transition (.35s) plus slack, for when no transitionend arrives.
const DRAWER_MS = 450
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
/** @param {HTMLElement} tile @param {number} top */
const holdStill = (tile, top) => {
  const window = windowOf(tile)
  const until = Date.now() + DRAWER_MS
  const step = () => {
    const moved = tile.getBoundingClientRect().top - top
    if (moved) window.scrollBy(0, moved)
    if (Date.now() < until) window.requestAnimationFrame(step)
  }
  window.requestAnimationFrame(step)
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

/** @param {HTMLElement} tile @param {string} html @param {boolean} [instant] */
export const open = (tile, html, instant = false) => {
  const document = tile.ownerDocument
  const el = document.createElement('div')
  el.className = 'info'
  const wrapper = document.createElement('div')
  wrapper.className = 'info-wrapper'
  wrapper.innerHTML = html
  el.append(wrapper)
  rowEnd(tile).after(el)
  mark(tile)
  drawer = el
  fadeFooters(document, fadeOut)
  if (instant) return el.classList.add('open')
  // Reading the height commits the closed state, so adding .open animates instead of appearing at once.
  void el.offsetHeight
  windowOf(tile).requestAnimationFrame(() => el.classList.add('open'))
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

/** @param {HTMLElement} tile @param {string} html */
const swap = (tile, html) => {
  const wrapper = /** @type {HTMLElement} */ (drawer?.querySelector('.info-wrapper'))
  const from = wrapper.offsetHeight
  wrapper.style.height = `${from}px`
  wrapper.innerHTML = html
  const to = wrapper.scrollHeight
  mark(tile)
  if (from === to) {
    wrapper.style.height = ''
    return
  }
  void wrapper.offsetHeight
  wrapper.style.height = `${to}px`
  afterTransition(wrapper, 'height', () => { wrapper.style.height = '' })
}

/** @param {HTMLElement} tile @param {string} html */
export const show = (tile, html) => {
  if (!isOpen() || !current) {
    current = null
    drawer = null
    return open(tile, html)
  }
  if (rowEnd(tile) === rowEnd(current)) return swap(tile, html)
  const top = tile.getBoundingClientRect().top
  close()
  open(tile, html)
  holdStill(tile, top)
}

/** @param {Document} document @param {Element} poster */
const togglePoster = async (document, poster) => {
  const tile = /** @type {HTMLElement} */ (poster.parentElement)
  if (isOpen() && current === tile) return close()
  // An edit search's results update the movie they were searched for, so they can't stay up under another movie.
  closePanel(document)
  const kind = document.getElementById('movie-list') ? 'movies' : 'shows'
  show(tile, await request(`/users/${tile.id}/${kind}/${poster.id}`))
}

/**
 * Binds the poster clicks.
 * @param {Document} document
 */
export const init = (document) => {
  for (const poster of ['.movie-modal', '.show-modal']) {
    on(document, 'click', poster, (event, link) => {
      event.preventDefault()
      togglePoster(document, link)
    })
  }
}

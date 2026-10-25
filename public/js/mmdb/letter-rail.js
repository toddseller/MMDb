// @ts-check
import { on } from '#mmdb/events.js'
import { close as closeDrawer } from '#mmdb/drawer.js'

const PHONE = '(max-width: 767px)'
const REDUCED = '(prefers-reduced-motion: reduce)'

// Read fresh each time: Clear and the Movies and TV Shows links replace the page, rail included.
/** @param {Document} document */
const railOf = (document) => document.getElementById('letter-rail')

/** @param {Document} document @param {string} letter */
const firstTile = (document, letter) =>
  /** @type {HTMLElement | null} */ (document.querySelector(`#movie-list [data-letter="${letter}"], #show-list [data-letter="${letter}"]`))

/** @param {Document} document */
const windowOf = (document) => /** @type {Window & typeof globalThis} */ (document.defaultView)

const FADE_MS = 2500

let long = false
let awake = false
let holding = false
/** @type {ReturnType<typeof setTimeout> | undefined} */
let idle

// Desktop shows the rail at all times from CSS. A phone's covers posters, so it shows past the first screen of a long
// page, and only while the user is scrolling or has a finger or focus on it.
/** @param {Document} document */
const update = (document) => {
  const window = windowOf(document)
  const rail = railOf(document)
  const wanted = awake || holding || Boolean(rail?.contains(document.activeElement))
  rail?.classList.toggle('shown', long && window.scrollY > window.innerHeight && wanted)
}

/** @param {Document} document */
const wake = (document) => {
  awake = true
  update(document)
  clearTimeout(idle)
  idle = setTimeout(() => {
    awake = false
    update(document)
  }, FADE_MS)
}

/** @param {Document} document */
const refresh = (document) => {
  const rail = railOf(document)
  if (!rail) return
  const window = windowOf(document)
  for (const link of rail.querySelectorAll('a')) {
    if (firstTile(document, link.dataset.letter ?? '')) {
      link.removeAttribute('aria-disabled')
      link.removeAttribute('tabindex')
      link.removeAttribute('aria-label')
    } else {
      link.setAttribute('aria-disabled', 'true')
      link.tabIndex = -1
      link.setAttribute('aria-label', `${link.textContent}, no titles`)
    }
  }
  long = document.documentElement.scrollHeight >= 3 * window.innerHeight
  update(document)
}

// A far jump moves at once to two screens short of the letter and glides the rest: the owner's choice on a 4,600-movie
// prototype, where gliding the whole way blanked out as posters loaded slower than they passed. 'auto' is instant,
// as no stylesheet sets scroll-behavior.
/** @param {Document} document @param {string} letter @param {boolean} [glide] */
const jump = (document, letter, glide = true) => {
  const tile = firstTile(document, letter)
  if (!tile) return
  closeDrawer(true)
  const window = windowOf(document)
  const bottom = document.documentElement.scrollHeight - window.innerHeight
  const to = Math.min(tile.getBoundingClientRect().top + window.scrollY - (parseFloat(window.getComputedStyle(tile).scrollMarginTop) || 0), bottom)
  if (!glide || window.matchMedia(REDUCED).matches) return window.scrollTo({ top: to, behavior: 'auto' })
  const reach = 2 * window.innerHeight
  if (Math.abs(to - window.scrollY) > reach) window.scrollTo({ top: to - Math.sign(to - window.scrollY) * reach, behavior: 'auto' })
  window.scrollTo({ top: to, behavior: 'smooth' })
}

// By proportion between # and Z, which every rail draws, so a short screen's every-other-letter rail still reaches
// the letters it leaves out.
/** @param {Element} rail @param {number} y */
const letterAt = (rail, y) => {
  const links = /** @type {NodeListOf<HTMLElement>} */ (rail.querySelectorAll('a'))
  const top = links[0].getBoundingClientRect().top
  const bottom = links[links.length - 1].getBoundingClientRect().bottom
  const index = Math.floor((y - top) / (bottom - top) * links.length)
  return links[Math.min(links.length - 1, Math.max(0, index))].dataset.letter ?? ''
}

// A finger is a tap until it moves this far; a drag then follows it.
const DRAG_PX = 6

let start = 0
let down = ''
let dragged = false
let skipClick = false

/**
 * Keeps the rail's letters in step with the grid on screen and shows a phone's rail while it's useful.
 * @param {Document} document
 */
export const init = (document) => {
  const window = windowOf(document)
  let pending = false
  // Filters, Clear and navigation all replace grids with server-rendered HTML; one refresh a frame covers any burst.
  const schedule = () => {
    if (pending) return
    pending = true
    window.requestAnimationFrame(() => {
      pending = false
      refresh(document)
    })
  }
  new window.MutationObserver(schedule).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', schedule)
  window.addEventListener('scroll', () => { if (window.matchMedia(PHONE).matches) wake(document) }, { passive: true })
  // Touch drives the rail by pointer events, so the click a tap ends with is skipped; a mouse is left to the click.
  on(document, 'pointerdown', '#letter-rail', (event, rail) => {
    const pointer = /** @type {PointerEvent} */ (event)
    skipClick = pointer.pointerType !== 'mouse'
    if (!skipClick) return
    holding = true
    dragged = false
    start = pointer.clientY
    down = /** @type {HTMLElement | null} */ (/** @type {Element} */ (pointer.target).closest('a'))?.dataset.letter ?? letterAt(rail, start)
    rail.setPointerCapture?.(pointer.pointerId)
    update(document)
  })
  document.addEventListener('pointermove', (event) => {
    const rail = railOf(document)
    if (!holding || !rail || (!dragged && Math.abs(event.clientY - start) < DRAG_PX)) return
    const letter = letterAt(rail, event.clientY)
    if ((dragged && letter === down) || !firstTile(document, letter)) return
    dragged = true
    down = letter
    jump(document, letter, false)
  })
  for (const type of ['pointerup', 'pointercancel']) {
    document.addEventListener(type, () => {
      if (!holding) return
      holding = false
      if (type === 'pointerup' && !dragged) jump(document, down)
      wake(document)
    })
  }
  // Pointer capture can aim a tap's click at the rail rather than the letter, or drop it, so every click on the rail
  // clears the skip; a keyboard's click (detail 0) is never skipped.
  on(document, 'click', '#letter-rail', (event) => {
    event.preventDefault()
    const tapped = skipClick && /** @type {MouseEvent} */ (event).detail > 0
    skipClick = false
    const link = /** @type {HTMLElement | null} */ (/** @type {Element} */ (event.target).closest('a'))
    if (link && !tapped) jump(document, link.dataset.letter ?? '')
  })
  on(document, 'focusin', '#letter-rail', () => update(document))
  on(document, 'focusout', '#letter-rail', () => wake(document))
  // A fresh start for each page the tests load; a page runs init once.
  awake = false
  holding = false
  skipClick = false
  idle = undefined
  refresh(document)
}

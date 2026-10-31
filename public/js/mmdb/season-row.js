// @ts-check
import { on } from '#mmdb/events.js'
import { updateArrows, scrollPage } from '#mmdb/scroll-arrows.js'

/** @param {Element} line */
const arrows = (line) => {
  const row = /** @type {Element} */ (line.parentElement)
  return /** @type {[HTMLElement, HTMLElement]} */ ([row.querySelector('.season-arrow.left'), row.querySelector('.season-arrow.right')])
}

/**
 * Places a show's season line as its details arrive: at `keep` when the same show reloads, so nothing in it moves, or
 * else just far enough that the active season clears the right arrow. Runs before the drawer is seen, so it never glides.
 * @param {Element} content @param {number} [keep] the line's scroll position before the reload
 */
export const placeSeasons = (content, keep) => {
  const line = /** @type {HTMLElement | null} */ (content.querySelector('#season-default'))
  if (!line) return
  const [left, right] = arrows(line)
  const active = /** @type {HTMLElement | null} */ (line.querySelector('#active-season'))
  // Not right.offsetWidth: the arrow is still display: none here, so it measures 0px. The CSS gives the line its width as scroll padding.
  const arrowWidth = parseFloat(line.ownerDocument.defaultView?.getComputedStyle(line).scrollPaddingRight ?? '') || 0
  const end = active ? active.offsetLeft + active.offsetWidth + arrowWidth : 0
  line.scrollLeft = keep ?? Math.min(Math.max(0, end - line.clientWidth), line.scrollWidth - line.clientWidth)
  updateArrows(line, left, right, { instant: true })
}

/** @param {Element} line */
const update = (line) => updateArrows(/** @type {HTMLElement} */ (line), ...arrows(line))

/**
 * Binds the season arrows, and keeps them matched to the line however it scrolls: arrow, swipe, trackpad or Tab.
 * @param {Document} document
 */
export const init = (document) => {
  on(document, 'click', '.season-arrow', (_event, arrow) => {
    const line = /** @type {HTMLElement} */ (arrow.parentElement?.querySelector('#season-default'))
    scrollPage(line, arrow.classList.contains('left') ? -1 : 1)
  })
  // scroll doesn't bubble, so it's caught on the way down; the line is replaced each time the drawer's details are.
  document.addEventListener('scroll', (event) => {
    const target = /** @type {Element} */ (event.target)
    if (target.id === 'season-default') update(target)
  }, true)
  document.defaultView?.addEventListener('resize', () => document.querySelectorAll('#season-default').forEach(update))
}

// @ts-check
import { fadeIn, fadeOut } from '#mmdb/motion.js'

// What each arrow is meant to show; its display can't say, since a fading-out arrow still reads as shown.
/** @type {WeakMap<HTMLElement, boolean>} */
const shown = new WeakMap()

/** @param {HTMLElement} arrow @param {boolean} wanted @param {boolean} instant */
const toggle = (arrow, wanted, instant) => {
  if (wanted === (shown.get(arrow) ?? false)) return
  shown.set(arrow, wanted)
  if (instant) arrow.style.display = wanted ? 'block' : 'none'
  else if (wanted) fadeIn(arrow, 'block')
  else fadeOut(arrow)
}

/** @param {HTMLElement[]} arrows */
export const hideArrows = (...arrows) => {
  for (const arrow of arrows) {
    shown.set(arrow, false)
    arrow.style.display = 'none'
  }
}

/**
 * Shows the left arrow only while the panel is scrolled past its start, and the right one only while more is hidden past its end.
 * @param {HTMLElement} panel @param {HTMLElement} left @param {HTMLElement} right
 * @param {{ instant?: boolean }} [options] instant for arrows that arrive with new content, which has nothing to fade from
 */
export const updateArrows = (panel, left, right, { instant = false } = {}) => {
  toggle(left, panel.scrollLeft > 0, instant)
  toggle(right, panel.scrollLeft + panel.clientWidth < panel.scrollWidth - 1, instant)
}

/** @param {HTMLElement} panel @param {number} direction */
export const scrollPage = (panel, direction) => {
  const reduced = panel.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  panel.scrollBy({ left: direction * panel.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
}

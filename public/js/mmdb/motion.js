// @ts-check

// jQuery's default fade, which the footer used before.
const FADE_MS = 400

/** @param {HTMLElement} el */
const still = (el) => !el.animate || Boolean(el.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches)

// A newer fade or slide wins: a cancelled animation never runs its onfinish, so an earlier hide can't land after a show.
/** @param {HTMLElement} el */
export const stop = (el) => el.getAnimations?.().forEach((animation) => animation.cancel())

/** @param {number} px */
const clipped = (px) => ({ height: `${px}px`, overflow: 'hidden' })

/**
 * @param {HTMLElement} el
 * @param {string} [display] the value to show with, for elements the stylesheet hides
 */
export const fadeIn = (el, display = '') => {
  stop(el)
  el.style.display = display
  if (!still(el)) el.animate([{ opacity: 0 }, { opacity: 1 }], FADE_MS)
}

/** @param {HTMLElement} el */
export const fadeOut = (el) => {
  stop(el)
  if (still(el)) {
    el.style.display = 'none'
    return
  }
  el.animate([{ opacity: 1 }, { opacity: 0 }], FADE_MS).onfinish = () => { el.style.display = 'none' }
}

/** @param {HTMLElement} el @param {string} display @param {number} ms */
export const slideDown = (el, display, ms) => {
  stop(el)
  el.style.display = display
  if (!still(el)) el.animate([clipped(0), clipped(el.offsetHeight)], ms)
}

/** @param {HTMLElement} el @param {number} ms */
export const slideUp = (el, ms) => {
  stop(el)
  if (still(el)) {
    el.style.display = 'none'
    return
  }
  el.animate([clipped(el.offsetHeight), clipped(0)], ms).onfinish = () => { el.style.display = 'none' }
}

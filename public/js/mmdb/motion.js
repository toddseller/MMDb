// @ts-check

// jQuery's default fade, which the footer used before.
const FADE_MS = 400

/** @param {HTMLElement} el */
const still = (el) => !el.animate || Boolean(el.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches)

/** @param {HTMLElement} el */
export const fadeIn = (el) => {
  el.style.display = ''
  if (!still(el)) el.animate([{ opacity: 0 }, { opacity: 1 }], FADE_MS)
}

/** @param {HTMLElement} el */
export const fadeOut = (el) => {
  if (still(el)) {
    el.style.display = 'none'
    return
  }
  el.animate([{ opacity: 1 }, { opacity: 0 }], FADE_MS).onfinish = () => { el.style.display = 'none' }
}

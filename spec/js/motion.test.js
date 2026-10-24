// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage } from './dom.js'
import { fadeIn, fadeOut } from '#mmdb/motion.js'

/**
 * A footer on a page whose motion preference and animation support the test picks.
 * @param {{ reduced?: boolean, animates?: boolean }} [options]
 */
const footer = ({ reduced = false, animates = true } = {}) => {
  const { window, document } = makePage('<div class="footer">2 Movies</div>')
  window.matchMedia = /** @type {any} */ ((/** @type {string} */ query) => ({ matches: reduced && query === '(prefers-reduced-motion: reduce)' }))
  const el = /** @type {HTMLElement} */ (document.querySelector('.footer'))
  /** @type {Array<{ keyframes: Keyframe[], duration: unknown, finish: () => void }>} */
  const animations = []
  if (animates) {
    el.animate = /** @type {any} */ ((/** @type {Keyframe[]} */ keyframes, /** @type {unknown} */ duration) => {
      const animation = { keyframes, duration, onfinish: /** @type {(() => void) | null} */ (null), finish: () => animation.onfinish?.() }
      animations.push(animation)
      return animation
    })
  }
  return { el, animations }
}

test('fadeOut fades opacity to 0 over 400ms, then hides the element', () => {
  const { el, animations } = footer()

  fadeOut(el)
  assert.deepEqual(animations[0].keyframes, [{ opacity: 1 }, { opacity: 0 }])
  assert.equal(animations[0].duration, 400)
  assert.equal(el.style.display, '')

  animations[0].finish()
  assert.equal(el.style.display, 'none')
})

test('fadeIn shows the element, then fades opacity up to 1 over 400ms', () => {
  const { el, animations } = footer()
  el.style.display = 'none'

  fadeIn(el)

  assert.equal(el.style.display, '')
  assert.deepEqual(animations[0].keyframes, [{ opacity: 0 }, { opacity: 1 }])
  assert.equal(animations[0].duration, 400)
})

for (const [why, options] of /** @type {const} */ ([['reduced motion', { reduced: true }], ['no animation support', { animates: false }]])) {
  test(`with ${why} both act at once`, () => {
    const { el, animations } = footer(options)

    fadeOut(el)
    assert.equal(el.style.display, 'none')
    fadeIn(el)
    assert.equal(el.style.display, '')
    assert.equal(animations.length, 0)
  })
}

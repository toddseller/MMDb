// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubAnimate } from './dom.js'
import { fadeIn, fadeOut, slideDown, slideUp } from '#mmdb/motion.js'

/**
 * A footer on a page whose motion preference and animation support the test picks.
 * @param {{ reduced?: boolean, animates?: boolean }} [options]
 */
const footer = ({ reduced = false, animates = true } = {}) => {
  const { window, document } = makePage('<div class="footer">2 Movies</div>')
  window.matchMedia = /** @type {any} */ ((/** @type {string} */ query) => ({ matches: reduced && query === '(prefers-reduced-motion: reduce)' }))
  const el = /** @type {HTMLElement} */ (document.querySelector('.footer'))
  const animations = animates ? stubAnimate(el) : []
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

test('fadeIn shows the element with a given display, for elements the stylesheet hides', () => {
  const { el } = footer()
  el.style.display = 'none'

  fadeIn(el, 'block')

  assert.equal(el.style.display, 'block')
})

test('slideDown shows the element, then grows it from 0 to its height over the given time', () => {
  const { el, animations } = footer()
  Object.defineProperty(el, 'offsetHeight', { value: 300 })
  el.style.display = 'none'

  slideDown(el, 'flex', 300)

  assert.equal(el.style.display, 'flex')
  assert.deepEqual(animations[0].keyframes, [{ height: '0px', overflow: 'hidden' }, { height: '300px', overflow: 'hidden' }])
  assert.equal(animations[0].duration, 300)
})

test('slideUp shrinks the element to 0 over the given time, then hides it', () => {
  const { el, animations } = footer()
  Object.defineProperty(el, 'offsetHeight', { value: 300 })

  slideUp(el, 500)
  assert.deepEqual(animations[0].keyframes, [{ height: '300px', overflow: 'hidden' }, { height: '0px', overflow: 'hidden' }])
  assert.equal(animations[0].duration, 500)
  assert.equal(el.style.display, '')

  animations[0].finish()
  assert.equal(el.style.display, 'none')
})

for (const [why, options] of /** @type {const} */ ([['reduced motion', { reduced: true }], ['no animation support', { animates: false }]])) {
  test(`with ${why} slides act at once`, () => {
    const { el, animations } = footer(options)

    slideUp(el, 300)
    assert.equal(el.style.display, 'none')
    slideDown(el, 'block', 300)
    assert.equal(el.style.display, 'block')
    assert.equal(animations.length, 0)
  })
}

test('showing an element while it fades out keeps it shown', () => {
  const { el, animations } = footer()

  fadeOut(el)
  fadeIn(el)
  animations[0].finish()

  assert.equal(el.style.display, '')
})

test('opening an element while it slides up keeps it open', () => {
  const { el, animations } = footer()
  Object.defineProperty(el, 'offsetHeight', { value: 300 })

  slideUp(el, 300)
  slideDown(el, 'flex', 300)
  animations[0].finish()

  assert.equal(el.style.display, 'flex')
})

// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubAnimate } from './dom.js'
import { updateArrows } from '#mmdb/scroll-arrows.js'

const setup = () => {
  const { window, document } = makePage('<div id="panel"></div><button id="left"></button><button id="right"></button>')
  window.matchMedia = /** @type {any} */ (() => ({ matches: false }))
  const [panel, left, right] = /** @type {HTMLElement[]} */ (['panel', 'left', 'right'].map((id) => document.getElementById(id)))
  for (const [name, value] of Object.entries({ scrollWidth: 2400, clientWidth: 1000 })) Object.defineProperty(panel, name, { value, configurable: true })
  panel.scrollLeft = 1400
  return { panel, left, right }
}

test('arrows that arrive with new content are set at once, without a fade', () => {
  const { panel, left, right } = setup()
  const animations = [stubAnimate(left), stubAnimate(right)]

  updateArrows(panel, left, right, { instant: true })

  assert.equal(left.style.display, 'block')
  assert.notEqual(right.style.display, 'block')
  assert.deepEqual(animations.flat(), [])
})

test('arrows fade by default', () => {
  const { panel, left, right } = setup()
  const animations = stubAnimate(left)

  updateArrows(panel, left, right)

  assert.equal(left.style.display, 'block')
  assert.equal(animations.length, 1)
})

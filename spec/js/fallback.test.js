// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage } from './dom.js'
import { init } from '#mmdb/fallback.js'

// jsdom loads no images, so each test says whether an image has finished loading.
/** @param {string} markup @param {boolean} [complete] */
const load = (markup, complete = false) => {
  const page = makePage(markup)
  page.document.querySelectorAll('img').forEach((img) => Object.defineProperty(img, 'complete', { value: complete }))
  init(page.document)
  return page
}

/** @param {ReturnType<typeof makePage>} page */
const fail = (page) => {
  const img = /** @type {HTMLImageElement} */ (page.document.querySelector('img'))
  img.dispatchEvent(new page.window.Event('error'))
  return img
}

test('a poster that fails to load gets its fallback', () => {
  const page = load('<a><img src="/missing.jpg" data-fallback="/imgs/animated.svg"></a>')

  const img = fail(page)

  assert.equal(img.getAttribute('src'), '/imgs/animated.svg')
  assert.ok(!img.hasAttribute('data-fallback'))
})

test('a fallback that fails too is left alone', () => {
  const page = load('<img src="/missing.jpg" data-fallback="/imgs/animated.svg">')
  const img = fail(page)

  img.setAttribute('src', '/also-missing.svg')
  fail(page)

  assert.equal(img.getAttribute('src'), '/also-missing.svg')
})

test('an image without a fallback is left alone', () => {
  const page = load('<img src="/missing.jpg">')

  const img = fail(page)

  assert.equal(img.getAttribute('src'), '/missing.jpg')
})

test('a poster that failed before the scripts started gets its fallback on start', () => {
  const page = load('<img src="/missing.jpg" data-fallback="/imgs/animated.svg">', true)

  assert.equal(page.document.querySelector('img')?.getAttribute('src'), '/imgs/animated.svg')
})

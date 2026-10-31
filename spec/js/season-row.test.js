// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubAnimate } from './dom.js'
import { placeSeasons, init } from '#mmdb/season-row.js'

const SEASON_WIDTH = 40
const ARROW_WIDTH = 34
const LINE_WIDTH = 1000

// The season row as _show_info.erb renders it. jsdom has no layout, so each season and the line get their sizes here.
/** @param {{ seasons?: number, active?: number }} [options] */
const drawer = ({ seasons = 48, active = 48 } = {}) => {
  const buttons = Array.from({ length: seasons }, (_, i) => i + 1)
    .map((n) => `<input class="season-submit"${n === active ? ' id="active-season"' : ''} type="submit" name="season[:id]" value="${n}">`).join('')
  const page = makePage(`<div class="info-wrapper"><div class="season-row">
    <form id="season-default" action="/users/7/shows/3/seasons/" method="POST">${buttons}</form>
    <button type="button" class="season-arrow left" aria-label="Earlier seasons"></button>
    <button type="button" class="season-arrow right" aria-label="Later seasons"></button>
  </div></div>`)
  page.window.matchMedia = /** @type {any} */ (() => ({ matches: false }))
  const { document } = page
  const line = /** @type {HTMLElement} */ (document.getElementById('season-default'))
  const size = (/** @type {Element} */ el, /** @type {Record<string, number>} */ sizes) => {
    for (const [name, value] of Object.entries(sizes)) Object.defineProperty(el, name, { value, configurable: true })
  }
  size(line, { clientWidth: LINE_WIDTH, scrollWidth: seasons * SEASON_WIDTH })
  line.querySelectorAll('input').forEach((input, i) => size(input, { offsetLeft: i * SEASON_WIDTH, offsetWidth: SEASON_WIDTH }))
  const left = /** @type {HTMLElement} */ (document.querySelector('.season-arrow.left'))
  const right = /** @type {HTMLElement} */ (document.querySelector('.season-arrow.right'))
  // The arrows are display: none until placeSeasons shows them, so they measure 0px; the CSS gives the line their width as scroll padding.
  for (const arrow of [left, right]) size(arrow, { offsetWidth: 0 })
  line.style.scrollPaddingRight = `${ARROW_WIDTH}px`
  const content = /** @type {HTMLElement} */ (document.querySelector('.info-wrapper'))
  return { ...page, content, line, left, right, animations: [stubAnimate(left), stubAnimate(right)] }
}

test('a drawer opening on the last season lands the line at its end, with only the left arrow and no fade', () => {
  const { content, line, left, right, animations } = drawer({ active: 48 })

  placeSeasons(content)

  assert.equal(line.scrollLeft, 48 * SEASON_WIDTH - LINE_WIDTH)
  assert.equal(left.style.display, 'block')
  assert.notEqual(right.style.display, 'block')
  assert.deepEqual(animations.flat(), [])
})

test('an active season in the middle lands just clear of the right arrow', () => {
  const { content, line } = drawer({ active: 30 })

  placeSeasons(content)

  assert.equal(line.scrollLeft, 30 * SEASON_WIDTH + ARROW_WIDTH - LINE_WIDTH)
})

test('an active season that fits from the start leaves the line at its start, with only the right arrow', () => {
  const { content, line, left, right } = drawer({ active: 3 })

  placeSeasons(content)

  assert.equal(line.scrollLeft, 0)
  assert.notEqual(left.style.display, 'block')
  assert.equal(right.style.display, 'block')
})

test('a kept position is restored instead of landing on the active season', () => {
  const { content, line, left, right } = drawer({ active: 20 })

  placeSeasons(content, 720)

  assert.equal(line.scrollLeft, 720)
  assert.equal(left.style.display, 'block')
  assert.equal(right.style.display, 'block')
})

/** @param {ReturnType<typeof drawer>} page */
const recordScrolls = ({ line }) => {
  /** @type {ScrollToOptions[]} */
  const scrolls = []
  line.scrollBy = /** @type {any} */ ((/** @type {ScrollToOptions} */ options) => { scrolls.push(options) })
  return scrolls
}

for (const [arrow, left] of /** @type {const} */ ([['left', -LINE_WIDTH], ['right', LINE_WIDTH]])) {
  test(`the ${arrow} arrow glides the line by its visible width`, () => {
    const page = drawer({ active: 20 })
    init(page.document)
    const scrolls = recordScrolls(page)

    page[arrow].click()

    assert.deepEqual(scrolls, [{ left, behavior: 'smooth' }])
  })
}

test('under reduced motion an arrow moves the line at once', () => {
  const page = drawer({ active: 20 })
  page.window.matchMedia = /** @type {any} */ ((/** @type {string} */ query) => ({ matches: query.includes('reduce') }))
  init(page.document)
  const scrolls = recordScrolls(page)

  page.right.click()

  assert.deepEqual(scrolls, [{ left: LINE_WIDTH, behavior: 'auto' }])
})

test('scrolling the line, by arrow, swipe or keyboard, fades the arrows to match', () => {
  const { window, document, content, line, left, right, animations } = drawer({ active: 3 })
  init(document)
  placeSeasons(content)

  line.scrollLeft = 920
  line.dispatchEvent(new window.Event('scroll'))

  assert.equal(left.style.display, 'block')
  assert.equal(animations[0].length, 1)
  assert.equal(animations[1].length, 1)
  animations[1][0].finish()
  assert.equal(right.style.display, 'none')
})

test('content with no season line, such as a movie, is left alone', () => {
  const { document } = makePage('<div class="info-wrapper"><h1>Amber</h1></div>')

  assert.doesNotThrow(() => placeSeasons(/** @type {HTMLElement} */ (document.querySelector('.info-wrapper'))))
})

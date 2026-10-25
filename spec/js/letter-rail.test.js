// @ts-check
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { makePage } from './dom.js'
import { init } from '#mmdb/letter-rail.js'
import { open, isOpen, close } from '#mmdb/drawer.js'

const LETTERS = ['#', ...'abcdefghijklmnopqrstuvwxyz']
const HEIGHT = 800
// The tiles' scroll-margin-top, which keeps a jumped-to row clear of the pinned header.
const MARGIN = 60

// The rail and a grid as the views render them: tiles carry their letter, the rail one link per letter.
const RAIL = `<nav id="letter-rail" aria-label="Jump to letter">${LETTERS.map((letter) => `<a href="#" data-letter="${letter}">${letter.toUpperCase()}</a>`).join('')}</nav>`
/** @param {string[]} letters */
const tiles = (letters) => letters.map((letter, i) => `<div class="index-preview" id="7" data-letter="${letter}"><a class="movie-modal" id="${i}"><img></a><p>${letter} ${i}</p></div>`).join('')
/** @param {string[]} letters */
const collection = (letters) => `<div id="movie-list">${tiles(letters)}</div><footer><div class="footer">${letters.length} Movies</div></footer>${RAIL}`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {Array<() => void>} */
let frames
/** @type {{ phone: boolean, reduced: boolean }} */
let media
let pageHeight = 0
/** @type {ScrollToOptions[]} */
let scrolls

/** @param {string} id */
const byId = (id) => /** @type {HTMLElement} */ (page.document.getElementById(id))
const rail = () => byId('letter-rail')
/** @param {string} letter */
const link = (letter) => /** @type {HTMLAnchorElement} */ (rail().querySelector(`[data-letter="${letter}"]`))
const runFrames = () => { for (const frame of frames.splice(0)) frame() }
const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve() }
const shown = () => rail().classList.contains('shown')

/** @param {number} y */
const scrollTo = (y) => {
  page.window.scrollY = y
  page.window.dispatchEvent(new page.window.Event('scroll'))
}

/** @param {string[]} letters @param {{ phone?: boolean, height?: number }} [options] */
const load = (letters, { phone = false, height = HEIGHT * 20 } = {}) => {
  page = makePage(`<div id="user-page">${collection(letters)}</div>`)
  media = { phone, reduced: false }
  page.window.matchMedia = /** @type {any} */ ((/** @type {string} */ query) => ({
    matches: (query === '(max-width: 767px)' && media.phone) || (query === '(prefers-reduced-motion: reduce)' && media.reduced),
    addEventListener: () => {},
  }))
  frames = []
  page.window.requestAnimationFrame = (frame) => { frames.push(() => frame(0)); return frames.length }
  Object.defineProperty(page.window, 'innerHeight', { value: HEIGHT, configurable: true })
  pageHeight = height
  Object.defineProperty(page.document.documentElement, 'scrollHeight', { get: () => pageHeight, configurable: true })
  page.window.scrollY = 0
  scrolls = []
  page.window.scrollTo = /** @type {any} */ ((/** @type {ScrollToOptions} */ options) => {
    scrolls.push(options)
    page.window.scrollY = options.top ?? page.window.scrollY
  })
  page.window.getComputedStyle = /** @type {any} */ (() => ({ scrollMarginTop: `${MARGIN}px` }))
  close(true)
  init(page.document)
}

// Puts the first tile under a letter at a point on the page; an open drawer above it pushes it down, as it would.
/** @param {string} letter @param {number} top */
const place = (letter, top) => {
  const tile = /** @type {HTMLElement} */ (page.document.querySelector(`#movie-list [data-letter="${letter}"]`))
  tile.getBoundingClientRect = () => /** @type {DOMRect} */ ({ top: top - page.window.scrollY + (isOpen() ? 500 : 0) })
}

/** @param {string} letter */
// A click from a mouse or finger counts 1 in detail; one from the keyboard counts 0.
/** @param {string} letter @param {number} [detail] */
const choose = (letter, detail = 1) => link(letter).dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true, detail }))

beforeEach(() => mock.timers.enable({ apis: ['setTimeout'] }))
afterEach(() => mock.timers.reset())

test('a letter with no titles is marked so it cannot be chosen or reached by Tab', () => {
  load(['#', 'a', 'm', 's'])

  assert.equal(link('q').getAttribute('aria-disabled'), 'true')
  assert.equal(link('q').tabIndex, -1)
  assert.equal(link('q').getAttribute('aria-label'), 'Q, no titles')
})

test('a letter with titles is left as a plain link', () => {
  load(['#', 'a', 'm', 's'])

  for (const letter of ['#', 'a', 'm', 's']) {
    assert.equal(link(letter).hasAttribute('aria-disabled'), false)
    assert.equal(link(letter).hasAttribute('tabindex'), false)
    assert.equal(link(letter).hasAttribute('aria-label'), false)
  }
})

test('on a phone the rail shows once the page has scrolled a screen, and hides back above it', () => {
  load(['a', 'm', 's'], { phone: true })

  scrollTo(HEIGHT / 2)
  assert.equal(shown(), false)
  scrollTo(HEIGHT + 1)
  assert.equal(shown(), true)
  scrollTo(HEIGHT / 2)
  assert.equal(shown(), false)
})

test('on a phone the rail stays away from a page under three screens tall', () => {
  load(['a', 'm', 's'], { phone: true, height: HEIGHT * 3 - 1 })

  scrollTo(HEIGHT + 1)
  assert.equal(shown(), false)
})

test('a grid replaced by a search refreshes which letters can be chosen and whether the page is long enough', async () => {
  load(['a', 'm', 's'], { phone: true })

  pageHeight = HEIGHT * 2
  byId('movie-list').innerHTML = tiles(['b', 'w'])
  await settle()
  runFrames()

  assert.equal(link('a').getAttribute('aria-disabled'), 'true')
  assert.equal(link('b').hasAttribute('aria-disabled'), false)
  assert.equal(link('w').hasAttribute('aria-disabled'), false)
  scrollTo(HEIGHT + 1)
  assert.equal(shown(), false)
})

test('a page replaced with a new rail, as Clear does, gets its letters marked', async () => {
  load(['a', 'm', 's'])

  byId('user-page').innerHTML = collection(['b'])
  await settle()
  runFrames()

  assert.equal(link('a').getAttribute('aria-disabled'), 'true')
  assert.equal(link('b').hasAttribute('aria-disabled'), false)
})

// jsdom has no PointerEvent; a mouse event carrying pointerType stands in for one.
/** @param {string} type @param {Element} target @param {{ pointerType?: string, y?: number }} [options] */
const pointer = (type, target, { pointerType = 'touch', y = 0 } = {}) => {
  const event = new page.window.MouseEvent(type, { bubbles: true, cancelable: true, clientY: y })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  target.dispatchEvent(event)
}

test('on a phone the rail fades 2.5s after scrolling stops, and comes back with the next scroll', () => {
  load(['a', 'm', 's'], { phone: true })

  scrollTo(HEIGHT + 1)
  mock.timers.tick(2499)
  assert.equal(shown(), true)
  mock.timers.tick(1)
  assert.equal(shown(), false)
  scrollTo(HEIGHT + 2)
  assert.equal(shown(), true)
})

test('each scroll restarts the fade', () => {
  load(['a', 'm', 's'], { phone: true })

  scrollTo(HEIGHT + 1)
  mock.timers.tick(2000)
  scrollTo(HEIGHT + 2)
  mock.timers.tick(2000)
  assert.equal(shown(), true)
})

test('a finger on the rail holds it, and the fade starts again when it lifts', () => {
  load(['a', 'm', 's'], { phone: true })
  place('m', 5000)

  scrollTo(HEIGHT + 1)
  pointer('pointerdown', link('m'))
  mock.timers.tick(4000)
  assert.equal(shown(), true)
  pointer('pointerup', link('m'))
  mock.timers.tick(2499)
  assert.equal(shown(), true)
  mock.timers.tick(1)
  assert.equal(shown(), false)
})

test('focus on a rail letter holds the rail until focus leaves', () => {
  load(['a', 'm', 's'], { phone: true })

  scrollTo(HEIGHT + 1)
  link('m').focus()
  mock.timers.tick(4000)
  assert.equal(shown(), true)
  link('m').blur()
  mock.timers.tick(2500)
  assert.equal(shown(), false)
})

test('a far jump moves at once to two screens short of the letter, then glides the rest', () => {
  load(['a', 'm', 'w'])
  place('w', 8000)

  choose('w')
  assert.deepEqual(scrolls, [
    { top: 8000 - MARGIN - 2 * HEIGHT, behavior: 'auto' },
    { top: 8000 - MARGIN, behavior: 'smooth' },
  ])
})

test('a far jump back up moves at once to two screens below the letter', () => {
  load(['a', 'm', 'w'])
  place('a', 1000)
  page.window.scrollY = 9000

  choose('a')
  assert.deepEqual(scrolls, [
    { top: 1000 - MARGIN + 2 * HEIGHT, behavior: 'auto' },
    { top: 1000 - MARGIN, behavior: 'smooth' },
  ])
})

test('a jump of less than two screens only glides', () => {
  load(['a', 'm', 'w'])
  place('m', 3000)
  page.window.scrollY = 3000 - MARGIN - 2 * HEIGHT + 1

  choose('m')
  assert.deepEqual(scrolls, [{ top: 3000 - MARGIN, behavior: 'smooth' }])
})

test('a jump near the end stops at the bottom of the page', () => {
  load(['a', 'm', 'w'])
  place('w', pageHeight - 100)

  choose('w')
  assert.deepEqual(scrolls.at(-1), { top: pageHeight - HEIGHT, behavior: 'smooth' })
})

test('with reduced motion a jump moves at once', () => {
  load(['a', 'm', 'w'])
  media.reduced = true
  place('w', 8000)

  choose('w')
  assert.deepEqual(scrolls, [{ top: 8000 - MARGIN, behavior: 'auto' }])
})

test('choosing a letter with no titles does nothing', () => {
  load(['a', 'm', 'w'])

  choose('q')
  assert.deepEqual(scrolls, [])
})

test('choosing a letter keeps the link from changing the address', () => {
  load(['a', 'm', 'w'])
  place('m', 3000)

  assert.equal(choose('m'), false)
})

test('an open drawer closes at once before the page moves', () => {
  load(['a', 'm', 'w'])
  place('w', 8000)
  open(/** @type {HTMLElement} */ (page.document.querySelector('[data-letter="a"]')), '<p>Details</p>', true)

  choose('w')
  assert.equal(isOpen(), false)
  assert.equal(page.document.querySelector('.info'), null)
  assert.deepEqual(scrolls.at(-1), { top: 8000 - MARGIN, behavior: 'smooth' })
})

// The rail's letters run from 100 to 370, 10px each; only # and Z, which every rail draws, are measured.
const RAIL_TOP = 100
/** @param {string} letter */
const yOf = (letter) => RAIL_TOP + LETTERS.indexOf(letter) * 10 + 5
const layOutRail = () => {
  link('#').getBoundingClientRect = () => /** @type {DOMRect} */ ({ top: RAIL_TOP, bottom: RAIL_TOP + 10 })
  link('z').getBoundingClientRect = () => /** @type {DOMRect} */ ({ top: RAIL_TOP + 260, bottom: RAIL_TOP + 270 })
}

/** @param {string[]} letters */
const loadForDrag = (letters) => {
  load(letters, { phone: true })
  layOutRail()
  letters.forEach((letter, i) => place(letter, 1000 * (i + 1)))
}

test('dragging moves the page at once to each letter under the finger, by its height on the rail', () => {
  loadForDrag(['a', 'b', 'm'])

  pointer('pointerdown', link('a'), { y: yOf('a') })
  pointer('pointermove', rail(), { y: yOf('b') })
  assert.deepEqual(scrolls.at(-1), { top: 2000 - MARGIN, behavior: 'auto' })
  pointer('pointermove', rail(), { y: yOf('m') })
  assert.deepEqual(scrolls.at(-1), { top: 3000 - MARGIN, behavior: 'auto' })
})

test('dragging passes over letters with no titles', () => {
  loadForDrag(['p', 'r'])

  pointer('pointerdown', link('p'), { y: yOf('p') })
  pointer('pointermove', rail(), { y: yOf('q') })
  assert.equal(scrolls.length, 0)
  pointer('pointermove', rail(), { y: yOf('r') })
  assert.deepEqual(scrolls, [{ top: 2000 - MARGIN, behavior: 'auto' }])
})

test('a finger that wobbles a few pixels is still a tap, which glides when lifted', () => {
  loadForDrag(['a', 'm', 'w'])
  page.window.scrollY = 3000 - MARGIN - 100

  pointer('pointerdown', link('w'), { y: yOf('w') })
  pointer('pointermove', rail(), { y: yOf('w') + 4 })
  assert.equal(scrolls.length, 0)
  pointer('pointerup', rail(), { y: yOf('w') + 4 })
  assert.deepEqual(scrolls, [{ top: 3000 - MARGIN, behavior: 'smooth' }])
})

test('the click that follows a touch tap is ignored, so the tap moves the page once', () => {
  loadForDrag(['a', 'm', 'w'])
  page.window.scrollY = 3000 - MARGIN - 100

  pointer('pointerdown', link('w'), { y: yOf('w') })
  pointer('pointerup', link('w'), { y: yOf('w') })
  assert.equal(choose('w'), false)
  assert.equal(scrolls.length, 1)
})

test('a mouse is left to the click, so pressing and moving it does not drag', () => {
  loadForDrag(['a', 'm', 'w'])

  pointer('pointerdown', link('a'), { y: yOf('a'), pointerType: 'mouse' })
  pointer('pointermove', rail(), { y: yOf('m'), pointerType: 'mouse' })
  assert.equal(scrolls.length, 0)
  choose('m')
  assert.deepEqual(scrolls.at(-1), { top: 2000 - MARGIN, behavior: 'smooth' })
})

test('Enter on a letter after a touch still jumps, even when the tap never sent its click', () => {
  loadForDrag(['a', 'm', 'w'])

  pointer('pointerdown', link('w'), { y: yOf('w') })
  pointer('pointerup', rail(), { y: yOf('w') })
  choose('m', 0)
  assert.deepEqual(scrolls.at(-1), { top: 2000 - MARGIN, behavior: 'smooth' })
})

test('a page without a rail is never measured, so its changes cost no layout', async () => {
  load(['a', 'm', 's'])
  let measured = 0
  byId('letter-rail').remove()
  await settle()
  runFrames()
  Object.defineProperty(page.document.documentElement, 'scrollHeight', { get: () => { measured++; return pageHeight }, configurable: true })

  byId('movie-list').innerHTML = tiles(['b'])
  await settle()
  runFrames()
  assert.equal(measured, 0)
})

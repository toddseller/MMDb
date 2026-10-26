// @ts-check
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json } from './dom.js'
import { init, rowEnd, show, open, close, isOpen, openTile, keepOpen, reveal } from '#mmdb/drawer.js'

// Two rows of three movie tiles, as _movie_list.erb renders them; layout is stubbed since jsdom has none.
const ROWS = [['Amber', 'Birch', 'Cedar'], ['Delta', 'Ember', 'Fable']]

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {ReturnType<typeof stubFetch> | undefined} */
let fetched
/** @type {Array<() => void>} */
let frames

/** @param {string} title */
const tile = (title) => /** @type {HTMLElement} */ (page.document.querySelector(`[data-title="${title}"]`))
const drawers = () => [...page.document.querySelectorAll('#movie-list > .info')]
const footer = () => /** @type {HTMLElement} */ (page.document.querySelector('.footer'))
const runFrames = () => { for (const frame of frames.splice(0)) frame() }
/** @param {Element} el @param {string} propertyName */
const transitionEnd = (el, propertyName) => {
  const event = new page.window.Event('transitionend', { bubbles: true })
  Object.defineProperty(event, 'propertyName', { value: propertyName })
  el.dispatchEvent(event)
}
/** @param {string} title */
const clickPoster = (title) => tile(title).querySelector('a')?.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true }))
const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve() }

/** @param {HTMLElement} el @param {{ top: number, hidden?: boolean }} layout */
const place = (el, { top, hidden = false }) => {
  Object.defineProperty(el, 'offsetTop', { value: top })
  Object.defineProperty(el, 'offsetParent', { value: hidden ? null : page.document.body })
}

beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  const tiles = ROWS.flatMap((row) => row.map((title) =>
    `<div class="index-preview" id="7" data-title="${title}"><a class="movie-modal" id="${title.length}${title}"><img></a><p>${title}</p></div>`))
  page = makePage(`<div id="user-page"><div id="search"></div><div id="preview"></div><a id="dismiss"></a><div id="scroll-left"></div><div id="scroll-right"></div><div id="movie-list">${tiles.join('')}</div><footer><div class="footer">6 Movies</div></footer></div>`)
  ROWS.forEach((row, index) => row.forEach((title) => place(tile(title), { top: index * 300 })))
  frames = []
  page.window.requestAnimationFrame = (frame) => { frames.push(() => frame(0)); return frames.length }
  page.window.scrollBy = /** @type {any} */ (() => {})
  close(true)
  init(page.document)
})

afterEach(() => {
  fetched?.restore()
  fetched = undefined
  mock.timers.reset()
})

test('rowEnd finds the last tile on the clicked tile’s row', () => {
  assert.equal(rowEnd(tile('Amber')), tile('Cedar'))
  assert.equal(rowEnd(tile('Delta')), tile('Fable'))
  assert.equal(rowEnd(tile('Fable')), tile('Fable'))
})

test('rowEnd skips hidden tiles', () => {
  const hidden = page.document.createElement('div')
  hidden.className = 'index-preview'
  tile('Cedar').after(hidden)
  place(hidden, { top: 0, hidden: true })

  assert.equal(rowEnd(tile('Birch')), tile('Cedar'))
})

test('show opens the drawer after the row, marks the tile, then grows it on the next frame', () => {
  show(tile('Birch'), '<p>Birch details</p>')

  const [drawer] = drawers()
  assert.equal(drawer.previousElementSibling, tile('Cedar'))
  assert.equal(drawer.querySelector('.info-wrapper')?.innerHTML, '<p>Birch details</p>')
  assert.ok(tile('Birch').classList.contains('open'))
  assert.ok(!drawer.classList.contains('open'))
  runFrames()
  assert.ok(drawer.classList.contains('open'))
  assert.ok(isOpen())
})

test('close removes the drawer when its transition ends', () => {
  show(tile('Birch'), 'Birch')
  runFrames()
  const [drawer] = drawers()

  close()
  assert.ok(!drawer.classList.contains('open'))
  assert.ok(!tile('Birch').classList.contains('open'))
  transitionEnd(drawer, 'opacity')
  assert.equal(drawers().length, 1)
  transitionEnd(drawer, 'grid-template-rows')
  assert.equal(drawers().length, 0)
  assert.ok(!isOpen())
})

test('close removes the drawer after 450ms when no transition ends', () => {
  show(tile('Birch'), 'Birch')
  close()

  mock.timers.tick(449)
  assert.equal(drawers().length, 1)
  mock.timers.tick(1)
  assert.equal(drawers().length, 0)
})

test('close(true) removes the drawer at once', () => {
  show(tile('Birch'), 'Birch')
  close(true)
  assert.equal(drawers().length, 0)
})

test('show swaps the details for another tile on the same row', () => {
  show(tile('Amber'), 'Amber')
  runFrames()
  const [drawer] = drawers()

  show(tile('Cedar'), 'Cedar')

  assert.deepEqual(drawers(), [drawer])
  assert.equal(drawer.querySelector('.info-wrapper')?.textContent, 'Cedar')
  assert.ok(tile('Cedar').classList.contains('open'))
  assert.ok(!tile('Amber').classList.contains('open'))
})

test('show moves the drawer under another row', () => {
  show(tile('Amber'), 'Amber')
  runFrames()
  const [first] = drawers()

  show(tile('Ember'), 'Ember')

  assert.ok(!first.classList.contains('open'))
  const opened = drawers().find((drawer) => drawer !== first)
  assert.equal(opened?.previousElementSibling, tile('Fable'))
  mock.timers.tick(450)
  assert.deepEqual(drawers(), [opened])
})

test('a drawer the list re-rendered away counts as closed, so the next show opens a new one', () => {
  show(tile('Amber'), 'Amber')
  drawers()[0].remove()

  assert.ok(!isOpen())
  show(tile('Amber'), 'Amber again')
  assert.equal(drawers()[0].textContent, 'Amber again')
})

test('the footer fades out while the drawer is open and back in when it closes', () => {
  show(tile('Amber'), 'Amber')
  assert.equal(footer().style.display, 'none')
  close()
  assert.equal(footer().style.display, '')
})

test('a movie poster click requests its details and opens them', async () => {
  fetched = stubFetch(() => json('<p>Birch details</p>'))

  clickPoster('Birch')
  await settle()

  assert.equal(fetched.calls[0].url, '/users/7/movies/5Birch')
  assert.equal(drawers()[0].querySelector('.info-wrapper')?.innerHTML, '<p>Birch details</p>')
})

test('a show poster click requests the show’s details', async () => {
  fetched = stubFetch(() => json('<p>Harbor Lights</p>'))
  page.document.getElementById('movie-list')?.setAttribute('id', 'show-list')
  const poster = tile('Birch').querySelector('a')
  poster?.classList.replace('movie-modal', 'show-modal')

  clickPoster('Birch')
  await settle()

  assert.equal(fetched.calls[0].url, '/users/7/shows/5Birch')
})

test('clicking the open tile’s poster closes the drawer without a request', () => {
  fetched = stubFetch(() => json(''))
  show(tile('Birch'), 'Birch')

  clickPoster('Birch')

  assert.equal(fetched.calls.length, 0)
  assert.ok(!isOpen())
})

test('tile() is the open tile, and null once closed', () => {
  show(tile('Birch'), 'Birch')

  assert.equal(openTile(), tile('Birch'))
  close(true)
  assert.equal(openTile(), null)
  assert.equal('drawer' in page.window, false)
})

// The list as adding a show draws it: Aaron sorts first, so every other tile moves one place along.
const REDRAWN = [['Aaron', 'Amber', 'Birch'], ['Cedar', 'Delta', 'Ember'], ['Fable']]

/** @param {{ without?: string, hidden?: string }} [options] */
const redraw = ({ without, hidden } = {}) => () => {
  const list = /** @type {HTMLElement} */ (page.document.getElementById('movie-list'))
  list.innerHTML = REDRAWN.flat().filter((title) => title !== without).map((title) =>
    `<div class="index-preview" id="7" data-title="${title}"><a class="movie-modal" id="${title.length}${title}"><img></a><p>${title}</p></div>`).join('')
  REDRAWN.forEach((row, index) => row.forEach((title) => { if (title !== without) place(tile(title), { top: index * 300, hidden: title === hidden }) }))
}

/** @param {HTMLElement} el @param {number} top */
const at = (el, top) => { el.getBoundingClientRect = () => /** @type {DOMRect} */ ({ top }) }

test('keepOpen puts the open drawer back under its poster’s new row and eases to the new details', () => {
  show(tile('Ember'), 'Ember')
  runFrames()
  const [drawer] = drawers()
  const wrapper = /** @type {HTMLElement} */ (drawer.querySelector('.info-wrapper'))
  Object.defineProperty(wrapper, 'offsetHeight', { value: 100 })
  Object.defineProperty(wrapper, 'scrollHeight', { value: 160 })

  keepOpen(redraw(), 'Ember, two episodes')

  assert.deepEqual(drawers(), [drawer])
  assert.equal(drawer.previousElementSibling, tile('Ember'))
  assert.ok(tile('Ember').classList.contains('open'))
  assert.equal(openTile(), tile('Ember'))
  assert.equal(wrapper.textContent, 'Ember, two episodes')
  assert.equal(wrapper.style.height, '160px')
  transitionEnd(wrapper, 'height')
  assert.equal(wrapper.style.height, '')
  assert.ok(isOpen())
})

test('keepOpen without new details keeps the drawer’s content', () => {
  show(tile('Ember'), 'Ember')

  keepOpen(redraw())

  assert.equal(drawers()[0].previousElementSibling, tile('Ember'))
  assert.equal(drawers()[0].textContent, 'Ember')
  assert.ok(tile('Ember').classList.contains('open'))
})

for (const [what, options] of /** @type {const} */ ([['missing from', { without: 'Ember' }], ['hidden in', { hidden: 'Ember' }]])) {
  test(`keepOpen closes the drawer when its poster is ${what} the redrawn list`, () => {
    show(tile('Ember'), 'Ember')

    keepOpen(redraw(options), 'Ember again')

    assert.equal(drawers().length, 0)
    assert.ok(!isOpen())
    assert.equal(openTile(), null)
    assert.equal(footer().style.display, '')
  })
}

test('keepOpen with no drawer open only redraws the list', () => {
  keepOpen(redraw(), 'Ember')

  assert.ok(tile('Aaron'))
  assert.equal(drawers().length, 0)
  assert.ok(!isOpen())
})

test('keepOpen holds the poster where it was on screen for as long as it is asked', () => {
  /** @type {number[]} */
  const scrolled = []
  page.window.scrollBy = /** @type {any} */ ((/** @type {number} */ _x, /** @type {number} */ y) => { scrolled.push(y) })
  show(tile('Ember'), 'Ember')
  runFrames()
  at(tile('Ember'), 400)

  keepOpen(() => { redraw()(); at(tile('Ember'), 700) }, 'Ember', 500)
  runFrames()

  assert.deepEqual(scrolled, [300])
  mock.timers.tick(470)
  runFrames()
  assert.equal(frames.length, 1, 'still holding after the drawer’s own 450ms')
})

// A 900px window with the desktop header (scroll-margin-top 170px) and the 25px footer; every position is on screen.
/** @type {Array<{ top: number, behavior: string }>} */
let glides
/** @param {{ tile?: number, wrapper?: number, height?: number, margin?: number, reduced?: boolean }} layout */
const screen = ({ tile: tileTop = 400, wrapper = 600, height = 200, margin = 20, reduced = false } = {}) => {
  glides = []
  page.window.scrollBy = /** @type {any} */ ((/** @type {any} */ options) => { if (typeof options === 'object') glides.push(options) })
  Object.defineProperty(page.window, 'innerHeight', { value: 900, configurable: true })
  page.window.matchMedia = /** @type {any} */ ((/** @type {string} */ query) => ({ matches: reduced && query.includes('reduce') }))
  const computed = page.window.getComputedStyle.bind(page.window)
  page.window.getComputedStyle = /** @type {any} */ ((/** @type {Element} */ el) => {
    if (el.classList.contains('info')) return { marginTop: `${margin}px` }
    if (el.matches('.index-preview')) return { scrollMarginTop: '170px' }
    return computed(el)
  })
  const proto = page.window.HTMLElement.prototype
  proto.getBoundingClientRect = function () {
    if (this.tagName === 'FOOTER') return /** @type {DOMRect} */ ({ top: 875, height: 25 })
    return /** @type {DOMRect} */ ({ top: this.matches('.info-wrapper') ? wrapper : tileTop, height: 0 })
  }
  Object.defineProperty(proto, 'scrollHeight', { get() { return /** @type {HTMLElement} */ (this).matches('.info-wrapper') ? height : 0 }, configurable: true })
}
/** @param {Parameters<typeof screen>[0]} layout */
const openAt = (layout) => {
  show(tile('Ember'), 'Ember')
  screen(layout)
}

test('reveal glides down until the drawer’s bottom clears the footer', () => {
  openAt({ wrapper: 600, height: 400 })

  reveal()

  assert.deepEqual(glides, [{ top: 125, behavior: 'smooth' }])
})

test('reveal stops when the poster’s row reaches the pinned header', () => {
  openAt({ tile: 400, wrapper: 600, height: 1200 })

  reveal()

  assert.deepEqual(glides, [{ top: 230, behavior: 'smooth' }])
})

test('reveal leaves a drawer already in view alone', () => {
  openAt({ wrapper: 500, height: 300 })

  reveal()

  assert.deepEqual(glides, [])
})

test('reveal counts the open margin still to come while the drawer eases open', () => {
  openAt({ wrapper: 600, height: 260, margin: 0 })

  reveal()

  assert.deepEqual(glides, [{ top: 5, behavior: 'smooth' }])
})

test('reveal glides up to a poster under the header only when asked to', () => {
  openAt({ tile: 100, wrapper: 300, height: 200 })

  reveal()
  assert.deepEqual(glides, [])
  reveal(true)
  assert.deepEqual(glides, [{ top: -70, behavior: 'smooth' }])
})

test('reveal goes at once under reduced motion', () => {
  openAt({ wrapper: 600, height: 400, reduced: true })

  reveal()

  assert.deepEqual(glides, [{ top: 125, behavior: 'auto' }])
})

test('reveal with no drawer open does nothing', () => {
  screen()

  reveal(true)

  assert.deepEqual(glides, [])
})

/** Lets a hold of ms run out, then the frame after it. */
const holdFor = (/** @type {number} */ ms) => {
  runFrames()
  mock.timers.tick(ms)
  runFrames()
}

test('opening a drawer glides it into view at once', () => {
  screen({ wrapper: 600, height: 400, margin: 0 })

  show(tile('Ember'), 'Ember')

  assert.deepEqual(glides, [{ top: 145, behavior: 'smooth' }])
})

test('opening a drawer glides up to a poster under the header', () => {
  screen({ tile: 100, wrapper: 300, height: 200 })

  show(tile('Ember'), 'Ember')

  assert.deepEqual(glides, [{ top: -70, behavior: 'smooth' }])
})

test('a movie save’s instant reopen glides down only', () => {
  screen({ tile: 100, wrapper: 300, height: 200 })

  open(tile('Ember'), 'Ember', true)
  assert.deepEqual(glides, [])

  close(true)
  screen({ wrapper: 600, height: 400 })
  open(tile('Ember'), 'Ember', true)
  assert.deepEqual(glides, [{ top: 125, behavior: 'smooth' }])
})

test('switching posters in the same row glides to the new height, down only', () => {
  show(tile('Delta'), 'Delta')
  screen({ tile: 100, wrapper: 300, height: 200 })
  show(tile('Ember'), 'Ember')
  assert.deepEqual(glides, [])

  screen({ wrapper: 600, height: 400 })
  show(tile('Fable'), 'Fable')
  assert.deepEqual(glides, [{ top: 125, behavior: 'smooth' }])
})

test('switching rows glides only once the poster’s hold ends, and may glide up', () => {
  show(tile('Amber'), 'Amber')
  screen({ tile: 100, wrapper: 300, height: 200 })

  show(tile('Ember'), 'Ember')
  runFrames()
  assert.deepEqual(glides, [])
  mock.timers.tick(449)
  runFrames()
  assert.deepEqual(glides, [])
  holdFor(1)
  assert.deepEqual(glides, [{ top: -70, behavior: 'smooth' }])
})

test('keepOpen glides once its hold ends, down only', () => {
  show(tile('Ember'), 'Ember')
  screen({ tile: 100, wrapper: 300, height: 200 })
  keepOpen(redraw(), 'Ember again', 500)
  holdFor(500)
  assert.deepEqual(glides, [])

  screen({ wrapper: 600, height: 400 })
  keepOpen(redraw(), 'Ember again', 500)
  holdFor(500)
  assert.deepEqual(glides, [{ top: 125, behavior: 'smooth' }])
})

test('an image loading in the drawer glides down only', () => {
  show(tile('Ember'), '<img alt="Ember Poster">')
  screen({ tile: 100, wrapper: 300, height: 200 })
  const image = /** @type {HTMLElement} */ (drawers()[0].querySelector('img'))
  image.dispatchEvent(new page.window.Event('load'))
  assert.deepEqual(glides, [])

  screen({ wrapper: 600, height: 400 })
  image.dispatchEvent(new page.window.Event('load'))
  assert.deepEqual(glides, [{ top: 125, behavior: 'smooth' }])
})

test('an image loading in a drawer that has closed does nothing', () => {
  show(tile('Ember'), '<img alt="Ember Poster">')
  const image = /** @type {HTMLElement} */ (drawers()[0].querySelector('img'))
  close()
  screen({ wrapper: 600, height: 400 })

  image.dispatchEvent(new page.window.Event('load'))

  assert.deepEqual(glides, [])
})

test('an image loading in the movie edit form doesn’t glide', () => {
  show(tile('Ember'), '<form class="edit-form"><img alt=""></form>')
  screen({ wrapper: 600, height: 400 })

  drawers()[0].querySelector('.edit-form img')?.dispatchEvent(new page.window.Event('load'))

  assert.deepEqual(glides, [])
})

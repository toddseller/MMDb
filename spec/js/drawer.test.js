// @ts-check
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json } from './dom.js'
import { init, rowEnd, show, close, isOpen } from '#mmdb/drawer.js'

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
  page = makePage(`<div id="user-page"><div id="movie-list">${tiles.join('')}</div><footer><div class="footer">6 Movies</div></footer></div>`)
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

test('window.drawer lends only the open tile, for the season default', () => {
  show(tile('Birch'), 'Birch')

  assert.deepEqual(Object.keys(page.window.drawer), ['tile'])
  assert.equal(page.window.drawer.tile, tile('Birch'))
  close(true)
  assert.equal(page.window.drawer.tile, null)
})

// @ts-check
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json, html } from './dom.js'
import { init } from '#mmdb/filters.js'
import { open, isOpen } from '#mmdb/drawer.js'

// The parts of the collection page the filters use, as users/show.erb renders them.
const collection = (titles = ['Amber', 'Birch']) => `
  <div id="user-page">
    <form id="filter-input"><input id="search-movie-title" type="text">
      <span id="clear-btn"><input type="reset" value="Clear"></span></form>
    <a href="#" id="library">Library</a>
    <a href="/movies/new/7" id="unwatched">Unwatched</a>
    <a href="/movies/4k/7" id="four-k">4K</a>
    <div id="movie-list">${titles.map((title) => `<div class="index-preview" id="7"><p>${title}</p></div>`).join('')}</div>
    <footer><div class="footer" style="display: none">${titles.length} Movies</div></footer>
  </div>`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {ReturnType<typeof stubFetch>} */
let fetched

/** @param {(url: string) => Response} respond */
const answer = (respond) => { fetched = stubFetch((url) => respond(url)) }

/** @param {string} selector */
const click = (selector) => page.document.querySelector(selector)?.dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true }))

/** @param {string} text */
const type = (text) => {
  const input = /** @type {HTMLInputElement} */ (page.document.getElementById('search-movie-title'))
  for (const letter of text) {
    input.value += letter
    input.dispatchEvent(new page.window.KeyboardEvent('keyup', { bubbles: true }))
    mock.timers.tick(100)
  }
}

// Lets the awaited request and its page update finish.
const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve() }

const titles = () => [...page.document.querySelectorAll('#movie-list p')].map((p) => p.textContent)

beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout'] })
  page = makePage(collection())
  page.window.filterValue = ''
  init(page.document)
})

afterEach(() => {
  fetched?.restore()
  mock.timers.reset()
})

test('a title search waits for a 300ms pause and makes one request for the full text', async () => {
  answer(() => json({ page: '<div class="index-preview" id="7"><p>Amber</p></div>', count: 1 }))

  type('amb')
  assert.equal(fetched.calls.length, 0)
  mock.timers.tick(300)
  await settle()

  assert.equal(fetched.calls.length, 1)
  assert.equal(fetched.calls[0].url, '/movies/filter?filter=amb&id=7')
  assert.deepEqual(titles(), ['Amber'])
  const footer = /** @type {HTMLElement} */ (page.document.querySelector('.footer'))
  assert.equal(footer.textContent, '1 Movies')
  assert.equal(footer.style.display, '')
  assert.equal(page.window.filterValue, 'amb')
  assert.equal(page.window.sessionStorage.getItem('id'), '7')
})

test('Unwatched requests its link, replaces the grid and marks itself active', async () => {
  answer(() => html('<div class="index-preview" id="7"><p>Cedar</p></div>'))
  page.document.getElementById('four-k')?.classList.add('active')

  click('#unwatched')
  await settle()

  assert.equal(fetched.calls[0].url, '/movies/new/7')
  assert.deepEqual(titles(), ['Cedar'])
  assert.ok(page.document.getElementById('unwatched')?.classList.contains('active'))
  assert.ok(!page.document.getElementById('four-k')?.classList.contains('active'))
})

test('4K requests its link, replaces the grid and marks itself active', async () => {
  answer(() => html('<div class="index-preview" id="7"><p>Ultra Sharp</p></div>'))
  page.document.getElementById('unwatched')?.classList.add('active')

  click('#four-k')
  await settle()

  assert.equal(fetched.calls[0].url, '/movies/4k/7')
  assert.deepEqual(titles(), ['Ultra Sharp'])
  assert.ok(page.document.getElementById('four-k')?.classList.contains('active'))
  assert.ok(!page.document.getElementById('unwatched')?.classList.contains('active'))
})

for (const control of ['#clear-btn input', '#library']) {
  test(`${control} resets the filters, closes the drawer and restores the collection`, async () => {
    answer(() => json({ page: collection(['Amber', 'Birch', 'Cedar']), movie_count: '3' }))
    page.window.sessionStorage.setItem('id', '7')
    page.window.filterValue = 'amb'
    page.document.getElementById('unwatched')?.classList.add('active')
    open(/** @type {HTMLElement} */ (page.document.querySelector('.index-preview')), 'Amber details', true)

    click(control)
    await settle()

    assert.equal(fetched.calls[0].url, '/users/7')
    assert.ok(!isOpen())
    assert.equal(page.window.filterValue, '')
    assert.deepEqual(titles(), ['Amber', 'Birch', 'Cedar'])
    assert.equal(page.document.querySelector('.footer')?.textContent, '3 Movies')
    assert.ok(!page.document.getElementById('unwatched')?.classList.contains('active'))
  })
}

test('Unwatched still works after Clear has replaced the page', async () => {
  answer((url) => url === '/users/7' ? json({ page: collection(), movie_count: '2' }) : html('<div class="index-preview" id="7"><p>Cedar</p></div>'))
  page.window.sessionStorage.setItem('id', '7')

  click('#clear-btn input')
  await settle()
  click('#unwatched')
  await settle()

  assert.equal(fetched.calls[1].url, '/movies/new/7')
  assert.deepEqual(titles(), ['Cedar'])
})

// @ts-check
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json } from './dom.js'
import { init } from '#mmdb/credits.js'
import { listQuery, rememberQuery } from '#mmdb/filters.js'

// The collection page with a movie's details open, as users/show.erb and _info.erb render them.
const PAGE = `
  <div id="user-page">
    <div id="profile-wrapper"><img id="profile-image" style="display: none"><h1 id="profile-name"></h1></div>
    <form id="filter-input"><input id="search-movie-title" type="text"></form>
    <div id="movie-list">
      <div class="index-preview" id="7"><p>Amber</p></div>
      <div class="info"><div class="info-wrapper"><div class="description-details">
        <ul><li><a href="">Ann Lee</a></li><li><a href=""> Cy &amp; Co</a></li></ul>
        <div class="studio"><p><a href="">Amber Films</a></p></div>
      </div>
      <div class="episode-description"><p class="plot-truncate">A long plot.</p><p class="expand-plot">more</p></div>
      </div></div>
    </div>
  </div>`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {ReturnType<typeof stubFetch>} */
let fetched

/** @param {string} text */
const link = (text) => /** @type {HTMLElement} */ ([...page.document.querySelectorAll('a')].find((a) => a.textContent?.trim() === text))
/** @param {Element} el */
const click = (el) => {
  const event = new page.window.MouseEvent('click', { bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event
}
/** @param {string} id */
const byId = (id) => /** @type {HTMLElement} */ (page.document.getElementById(id))
const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve() }

beforeEach(() => {
  page = makePage(PAGE)
  rememberQuery('')
  fetched = stubFetch(() => json({ page: '<div class="index-preview" id="7"><p>Amber</p></div>', url: 'https://image.tmdb.org/t/p/w342/ann.jpg' }))
  init(page.document)
})

afterEach(() => fetched.restore())

test('clicking a credit searches the collection for it instead of following the link', async () => {
  /** @type {HTMLInputElement} */ (byId('search-movie-title')).value = 'amb'

  const event = click(link('Ann Lee'))
  await settle()

  assert.ok(event.defaultPrevented)
  assert.equal(/** @type {HTMLInputElement} */ (byId('search-movie-title')).value, '')
  assert.deepEqual(listQuery(page.document), { name: 'Ann Lee' })
  assert.deepEqual(fetched.calls.map((call) => call.url), ['/movies/search?filter=Ann+Lee&id=7'])
})

test('the search shows the name and picture above the results', async () => {
  click(link('Ann Lee'))
  await settle()

  assert.equal(byId('profile-name').textContent, 'Ann Lee')
  assert.equal(byId('profile-name').getAttribute('style'), null)
  assert.equal(byId('profile-image').getAttribute('src'), 'https://image.tmdb.org/t/p/w342/ann.jpg')
  assert.equal(byId('profile-image').style.display, '')
  assert.ok(byId('profile-wrapper').classList.contains('active'))
  assert.deepEqual([...page.document.querySelectorAll('#movie-list p')].map((p) => p.textContent), ['Amber'])
})

test('a name with no picture is centred without one', async () => {
  fetched.restore()
  fetched = stubFetch(() => json({ page: '', url: 'no-image' }))

  click(link('Ann Lee'))
  await settle()

  assert.equal(byId('profile-image').style.display, 'none')
  const name = byId('profile-name')
  assert.deepEqual([name.style.marginTop, name.style.left, name.style.textAlign], ['100px', '0px', 'center'])
})

test('a name is sent encoded, and the user id falls back to the session once the list is empty', async () => {
  page.window.sessionStorage.setItem('id', '9')
  page.document.querySelector('.index-preview')?.remove()

  click(link('Cy & Co'))
  await settle()

  assert.equal(fetched.calls[0].url, '/movies/search?filter=+Cy+%26+Co&id=9')
})

test('clicking the studio searches once', async () => {
  click(link('Amber Films'))
  await settle()

  assert.equal(fetched.calls.length, 1)
})

test('an episode plot’s toggle expands it, then collapses it', () => {
  const plot = /** @type {HTMLElement} */ (page.document.querySelector('.plot-truncate'))
  const toggle = /** @type {HTMLElement} */ (page.document.querySelector('.expand-plot'))

  click(toggle)
  assert.ok(plot.classList.contains('active'))
  assert.equal(toggle.textContent, 'less')

  click(toggle)
  assert.ok(!plot.classList.contains('active'))
  assert.equal(toggle.textContent, 'more')
})

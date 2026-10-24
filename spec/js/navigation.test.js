// @ts-check
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json, html } from './dom.js'
import { init, closeMenu } from '#mmdb/navigation.js'

// The navbar and menu from layout.erb, around another user's movies page as users/show.erb renders it.
const PAGE = `
  <a href="#" id="menu-toggle"><div id="nav-toggle"><span></span></div></a>
  <div id="drop-down"><ul>
    <a href="#"><div id="user-profile">Profile<span class="glyphicon glyphicon-triangle-right"></span></div></a>
    <div id="drop-down-submenu"><ul>
      <a id="user-movies" href="/users/7"><li>Movies</li></a>
      <a id="user-shows" href="/users/7/shows"><li>TV Shows</li></a>
    </ul></div>
  </ul></div>
  <div id="user-page">
    <div id="search-boxes"><a id="user-shows" href="/users/9/shows"><button id="switch">TV Shows</button></a></div>
    <div id="movie-list"></div>
    <footer><div class="footer">1 Movies</div></footer>
  </div>
  <div class="modal" id="movie"><div class="modal-dialog"><div class="modal-content movie-content"></div></div></div>`

// shows/show.erb as the TV Shows switch answers with it.
const SHOWS = `<div id="search-boxes"><a id="user-movies" href="/users/9"><button id="switch">Movies</button></a></div>
  <div id="show-list"></div><footer><div class="footer"></div></footer>`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {ReturnType<typeof stubFetch>} */
let fetched
/** @type {string[]} */
let modals
/** @type {(url: string) => Response} */
let answer

/** @param {string} selector */
const el = (selector) => /** @type {HTMLElement} */ (page.document.querySelector(selector))
/** @param {string | Element} target */
const click = (target) => {
  const event = new page.window.MouseEvent('click', { bubbles: true, cancelable: true })
  ;(typeof target === 'string' ? el(target) : target).dispatchEvent(event)
  return event
}
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }
const active = (/** @type {string} */ selector) => el(selector).classList.contains('active')
const TRIANGLE = '#user-profile .glyphicon-triangle-right'

beforeEach(() => {
  answer = () => json({})
  fetched = stubFetch((url) => answer(url))
  page = makePage(PAGE)
  modals = []
  page.window.$ = /** @type {any} */ ((/** @type {string} */ selector) => ({ modal: (/** @type {string} */ action) => modals.push(`${selector} ${action}`) }))
  init(page.document)
})

afterEach(() => fetched.restore())

test('the menu button opens the menu without following its link', () => {
  const event = click('#menu-toggle')

  assert.ok(event.defaultPrevented)
  assert.ok(active('#nav-toggle'))
  assert.ok(active('#drop-down'))
})

test('Profile opens the submenu and turns its triangle', () => {
  click('#menu-toggle')

  const event = click('#user-profile')

  assert.ok(event.defaultPrevented)
  assert.ok(active('#drop-down-submenu'))
  assert.ok(active(TRIANGLE))
  click('#user-profile')
  assert.ok(!active('#drop-down-submenu'))
  assert.ok(!active(TRIANGLE))
})

test('closing the menu closes the submenu and turns the triangle back', () => {
  click('#menu-toggle')
  click('#user-profile')

  click('#menu-toggle')

  for (const selector of ['#nav-toggle', '#drop-down', '#drop-down-submenu', TRIANGLE]) assert.ok(!active(selector), selector)
})

test('closeMenu closes everything the menu opened', () => {
  click('#menu-toggle')
  click('#user-profile')

  closeMenu(page.document)

  for (const selector of ['#nav-toggle', '#drop-down', '#drop-down-submenu', TRIANGLE]) assert.ok(!active(selector), selector)
})

test("the menu's TV Shows sends one request, swaps the page in, counts the shows and closes the menu", async () => {
  answer = () => json({ status: 'true', page: SHOWS, show_count: '2', episode_count: '6' })
  click('#menu-toggle')
  click('#user-profile')

  const event = click('#drop-down #user-shows li')
  await settle()

  assert.ok(event.defaultPrevented)
  assert.deepEqual(fetched.calls.map((call) => call.url), ['/users/7/shows'])
  assert.ok(el('#show-list'))
  assert.equal(el('.footer').textContent, '2 TV Shows \u2014 6 Episodes')
  assert.ok(!active('#drop-down'))
  assert.ok(!active('#drop-down-submenu'))
})

test("a page's switch button counts the movies, and the swapped-in button switches back", async () => {
  answer = (url) => url.endsWith('/shows')
    ? json({ status: 'true', page: SHOWS, show_count: '1', episode_count: '2' })
    : json({ status: 'true', page: '<div id="movie-list"></div><footer><div class="footer"></div></footer>', movie_count: '1' })
  click('#user-page #switch')
  await settle()

  click('#user-page #switch')
  await settle()

  assert.deepEqual(fetched.calls.map((call) => call.url), ['/users/9/shows', '/users/9'])
  assert.ok(el('#movie-list'))
  assert.equal(el('.footer').textContent, '1 Movies')
})

test('the footer is written as text', async () => {
  answer = () => json({ status: 'true', page: '<footer><div class="footer"></div></footer>', movie_count: '<b>1</b>' })

  click('#user-page #switch')
  await settle()

  assert.equal(el('.footer').textContent, '<b>1</b> Movies')
})

test('a home page poster opens the movie in the details dialog', async () => {
  el('#user-page').insertAdjacentHTML('beforeend', '<div class="top-preview"><a href="/movies/4/show"><img alt="Amber Poster"></a></div>')
  answer = () => html('<h2 class="modal-title">Amber</h2>')

  const event = click('.top-preview img')
  await settle()

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[0].url, '/movies/4/show')
  assert.equal(el('#movie .modal-content').textContent, 'Amber')
  assert.deepEqual(modals, ['#movie show'])
})

// @ts-check
import { on } from '#mmdb/events.js'
import { request } from '#mmdb/request.js'
import { modal } from '#mmdb/bootstrap.js'

const TRIANGLE = '#user-profile .glyphicon-triangle-right'

/** @param {Document} document @param {string} selector */
const toggle = (document, selector) => document.querySelector(selector)?.classList.toggle('active')

/** @param {Document} document */
export const closeMenu = (document) => {
  for (const selector of ['#nav-toggle', '#drop-down', '#drop-down-submenu', TRIANGLE]) document.querySelector(selector)?.classList.remove('active')
}

/** @param {Document} document */
const toggleMenu = (document) => {
  if (document.getElementById('drop-down')?.classList.contains('active')) return closeMenu(document)
  toggle(document, '#nav-toggle')
  toggle(document, '#drop-down')
}

/** @param {Document} document @param {Element} link */
const switchCollection = async (document, link) => {
  const response = await request(/** @type {string} */ (link.getAttribute('href')))
  const userPage = /** @type {HTMLElement} */ (document.getElementById('user-page'))
  closeMenu(document)
  userPage.innerHTML = response.page
  const footer = document.querySelector('.footer')
  if (footer) footer.textContent = 'show_count' in response ? `${response.show_count} TV Shows \u2014 ${response.episode_count} Episodes` : `${response.movie_count} Movies`
}

/** @param {Document} document @param {Element} poster */
const previewMovie = async (document, poster) => {
  const content = /** @type {HTMLElement} */ (document.querySelector('#movie .modal-content'))
  content.innerHTML = await request(/** @type {string} */ (poster.querySelector('a')?.getAttribute('href')))
  modal(document, '#movie', 'show')
}

/** @param {Document} document */
export const init = (document) => {
  on(document, 'click', '#menu-toggle', (event) => {
    event.preventDefault()
    toggleMenu(document)
  })
  on(document, 'click', '#user-profile', (event) => {
    event.preventDefault()
    toggle(document, '#drop-down-submenu')
    toggle(document, TRIANGLE)
  })
  // The menu and another user's page both carry these ids, so one delegated binding serves both.
  on(document, 'click', '#user-movies, #user-shows', (event, link) => {
    event.preventDefault()
    switchCollection(document, link)
  })
  on(document, 'click', '.top-preview', (event, poster) => {
    event.preventDefault()
    previewMovie(document, poster)
  })
}

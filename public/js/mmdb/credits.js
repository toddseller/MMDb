// @ts-check
import { on } from '#mmdb/events.js'
import { request } from '#mmdb/request.js'
import { rememberQuery } from '#mmdb/filters.js'

/** @param {Document} document @param {string} name */
const searchByName = async (document, name) => {
  const window = /** @type {Window} */ (document.defaultView)
  const form = /** @type {HTMLFormElement | null} */ (document.getElementById('filter-input'))
  form?.reset()
  rememberQuery(name)
  const id = document.querySelector('.index-preview')?.id || window.sessionStorage.getItem('id') || ''
  const { page, url } = await request(`/movies/search?${new URLSearchParams({ filter: name, id })}`)
  const image = /** @type {HTMLImageElement | null} */ (document.getElementById('profile-image'))
  const title = /** @type {HTMLElement | null} */ (document.getElementById('profile-name'))
  if (image && title) {
    if (url === 'no-image') {
      image.style.display = 'none'
      Object.assign(title.style, { marginTop: '100px', left: '0', textAlign: 'center' })
    } else {
      image.src = url
      image.style.display = ''
      title.removeAttribute('style')
    }
    title.textContent = name
  }
  document.getElementById('profile-wrapper')?.classList.add('active')
  const list = document.getElementById('movie-list')
  if (list) list.innerHTML = page
}

/** @param {Element} toggle */
const togglePlot = (toggle) => {
  const expanded = toggle.previousElementSibling?.classList.toggle('active')
  toggle.textContent = expanded ? 'less' : 'more'
}

/**
 * Binds the links inside the details drawer: credits and the studio search the collection, long plots expand.
 * @param {Document} document
 */
export const init = (document) => {
  on(document, 'click', '.description-details a', (event, link) => {
    event.preventDefault()
    searchByName(document, link.textContent ?? '')
  })
  on(document, 'click', '.expand-plot', (_event, toggle) => togglePlot(toggle))
}

// @ts-check
import { on, onSubmit } from '#mmdb/events.js'
import { request, fields } from '#mmdb/request.js'
import { open as openDrawer, close as closeDrawer } from '#mmdb/drawer.js'
import { search, close as closePanel } from '#mmdb/preview.js'
import { listQuery } from '#mmdb/filters.js'
import { fadeIn } from '#mmdb/motion.js'

/** @param {Document} document */
const parts = (document) => ({
  form: /** @type {HTMLFormElement | null} */ (document.querySelector('.info .edit-form')),
  error: /** @type {HTMLElement | null} */ (document.querySelector('.info .edit-error')),
  list: /** @type {HTMLElement} */ (document.getElementById('movie-list')),
})

// The stored title, not what's typed: the field's defaultValue is what the form was rendered with.
/** @param {Document} document */
const storedTitle = (document) => /** @type {HTMLTextAreaElement | null | undefined} */ (parts(document).form?.querySelector('textarea[name="movie[title]"]'))?.defaultValue ?? ''

// The drawer's .modal-body holds the details, then the form itself, so a refreshed form lands in the same place.
/** @param {Document} document @param {string} form */
const showForm = (document, form) => {
  const body = document.querySelector('.info .modal-body')
  if (body) body.outerHTML = form
}

/** @param {Document} document @param {'save' | 'delete'} verb @param {() => Promise<void>} attempt */
const tryTo = async (document, verb, attempt) => {
  // A search result can be picked after the drawer has moved on to another movie, which has no form or error line.
  const { error } = parts(document)
  if (error) error.hidden = true
  try {
    await attempt()
  } catch {
    if (!error) return
    error.textContent = `Couldn't ${verb} ${storedTitle(document)}. Try again.`
    error.hidden = false
  }
}

/** @param {Document} document @param {HTMLFormElement} form */
const save = (document, form) => tryTo(document, 'save', async () => {
  const body = fields(form)
  for (const [key, value] of Object.entries(listQuery(document))) body.append(key, value)
  const { page, query, id } = await request(form.getAttribute('action') ?? '', { method: 'PUT', body })
  closeDrawer(true)
  const { list } = parts(document)
  list.innerHTML = query
  // Tiles carry the user's id and poster links the movie's, so the movie is found by its link.
  const tile = /** @type {HTMLElement} */ (list.querySelector(`.movie-modal[id="${id}"]`)?.parentElement)
  // A save can take the movie out of the list shown, such as a rename under the title filter.
  if (tile) openDrawer(tile, page, true)
})

/** @param {Document} document @param {HTMLFormElement} form */
const remove = (document, form) => tryTo(document, 'delete', async () => {
  const body = new URLSearchParams(listQuery(document))
  const response = await request(form.getAttribute('action') ?? '', { method: 'DELETE', body })
  if (response.status !== 'true') throw new Error('The delete was not confirmed')
  closeDrawer(true)
  parts(document).list.innerHTML = response.page
  const footer = /** @type {HTMLElement | null} */ (document.querySelector('.footer'))
  if (!footer) return
  footer.textContent = `${response.movie_count} Movies`
  fadeIn(footer)
})

/** @param {Document} document */
const searchStored = (document) => {
  const route = parts(document).form?.getAttribute('action') ?? ''
  search(document, `/movies/update?${new URLSearchParams({ title: storedTitle(document), route })}`, 'movies')
}

/** @param {Document} document @param {HTMLFormElement} result */
const pick = (document, result) => tryTo(document, 'save', async () => {
  const form = await request(result.getAttribute('action') ?? '', { method: 'PUT', body: fields(result) })
  closePanel(document)
  if (parts(document).form) showForm(document, form)
})

// Checkboxes rather than radios, so the checked one can be unchecked to save the movie as standard definition.
/** @param {HTMLInputElement} box */
const checkOnly = (box) => {
  if (!box.checked) return
  box.form?.querySelectorAll(`input[type="checkbox"][name="${box.name}"]`).forEach((other) => {
    if (other !== box) /** @type {HTMLInputElement} */ (other).checked = false
  })
}

/** @param {Document} document @param {HTMLInputElement} star */
const rate = async (document, star) => {
  const action = star.form?.getAttribute('action') ?? ''
  const stars = await request(action, { method: 'POST', body: new URLSearchParams({ rating: star.value }) })
  const container = document.getElementById('ratings-container')
  if (container) container.innerHTML = stars
}

/**
 * Binds movie edit: the drawer's edit link, the form's save, delete and search, picking a search result, the quality checkboxes and the stars.
 * @param {Document} document
 */
export const init = (document) => {
  on(document, 'click', '.movie-edit', async (event, link) => {
    event.preventDefault()
    const form = await request(link.getAttribute('href') ?? '')
    closePanel(document)
    showForm(document, form)
  })
  on(document, 'submit', '.info .edit-form', onSubmit(save, document))
  on(document, 'submit', '.info #delete-form', onSubmit(remove, document))
  on(document, 'submit', '#update-movie', onSubmit(pick, document))
  on(document, 'click', '.info #update-search', (event) => {
    event.preventDefault()
    searchStored(document)
  })
  on(document, 'change', '.info .hd input[type="checkbox"]', (_event, box) => checkOnly(/** @type {HTMLInputElement} */ (box)))
  on(document, 'change', '.rating-input', (_event, star) => rate(document, /** @type {HTMLInputElement} */ (star)))
}

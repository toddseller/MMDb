// @ts-check
import { on } from '#mmdb/events.js'
import { request, fields } from '#mmdb/request.js'
import { openTile } from '#mmdb/drawer.js'
import { close as closePanel } from '#mmdb/preview.js'
import { open, close } from '#mmdb/dialog.js'

const FALLBACK_UPLOAD_ERROR = "The artwork couldn't be uploaded. Try again."

/** @param {Document} document */
const dialog = (document) => /** @type {HTMLElement} */ (document.getElementById('edit-show'))

/** @param {Document} document @param {string} selector */
const field = (document, selector) => /** @type {HTMLInputElement | HTMLTextAreaElement | null} */ (dialog(document).querySelector(selector))

/** @param {Document} document */
const isCreate = (document) => dialog(document).querySelector('.new-show') !== null

// The stored title, not what's typed, except in Create New Show, where nothing is stored yet.
/** @param {Document} document @param {string} name */
const titleOf = (document, name) => {
  const input = field(document, `textarea[name="${name}"]`)
  return (isCreate(document) ? input?.value : input?.defaultValue) ?? ''
}

/**
 * @param {Document} document @param {'save' | 'delete'} verb @param {string} title @param {() => Promise<void>} attempt
 * @returns {Promise<boolean>} whether the attempt succeeded
 */
const tryTo = async (document, verb, title, attempt) => {
  const error = /** @type {HTMLElement | null} */ (dialog(document).querySelector('.edit-error'))
  if (error) error.hidden = true
  try {
    await attempt()
    return true
  } catch {
    if (!error) return false
    error.textContent = `Couldn't ${verb} ${title}. Try again.`
    error.hidden = false
    return false
  }
}

// Every tab's form goes in one body, as jQuery's serialize of all .show-data forms did; the server updates each entity.
/** @param {Document} document */
const tabFields = (document) => {
  const body = new URLSearchParams()
  dialog(document).querySelectorAll('form.show-data').forEach((form) => {
    for (const [key, value] of fields(/** @type {HTMLFormElement} */ (form))) body.append(key, value)
  })
  return body
}

/** @param {Document} document @param {string} page @param {string} poster */
const showSaved = (document, page, poster) => {
  const wrapper = document.querySelector('.info .info-wrapper')
  if (wrapper) wrapper.innerHTML = page
  openTile()?.querySelector('img')?.setAttribute('src', poster)
}

/** @param {Document} document */
const save = async (document) => {
  const body = tabFields(document)
  body.append('show[poster]', field(document, 'input[name="season[poster]"]')?.value ?? '')
  // The Details form's id is the episode's, which tells the server which episode to update.
  body.append('form[id]', dialog(document).querySelector('#detail form')?.id ?? '')
  const action = dialog(document).querySelector('form.show-data')?.getAttribute('action') ?? ''
  const { page, poster } = await request(action, { method: 'PUT', body })
  showSaved(document, page, poster)
}

/** @param {Document} document */
const addEpisode = async (document) => {
  const body = tabFields(document)
  body.append('new', 'true')
  const { page, form, season, count } = await request('/shows', { method: 'POST', body })
  const episode = dialog(document).querySelector('#episode')
  if (episode) episode.innerHTML = form
  const list = document.getElementById('show-list')
  if (list) list.innerHTML = page
  const header = dialog(document).querySelector('.modal-header p')
  if (header) header.textContent = `Season ${season}, ${count} ${count > 1 ? 'episodes' : 'episode'} added`
}

/** @param {Element | null} chosen the tab or pane to show, among its siblings */
const activate = (chosen) => {
  chosen?.parentElement?.querySelectorAll(':scope > .active').forEach((other) => other.classList.remove('active'))
  chosen?.classList.add('active')
}

/** @param {Document} document */
const ok = (document) => {
  if (!isCreate(document)) return tryTo(document, 'save', titleOf(document, 'show[title]'), async () => {
    await save(document)
    close(document, 'edit-show')
  })
  // An untitled episode is refused by the server, and "+" has already added the ones before it.
  if (!titleOf(document, 'episode[title]').trim()) return close(document, 'edit-show')
  return tryTo(document, 'save', titleOf(document, 'show[title]'), async () => {
    await addEpisode(document)
    close(document, 'edit-show')
  })
}

// Saved before moving, so a failed save leaves the edits on screen instead of losing them to the next episode.
/** @param {Document} document @param {Element} arrow */
const move = async (document, arrow) => {
  if (!await tryTo(document, 'save', titleOf(document, 'show[title]'), () => save(document))) return
  try {
    dialog(document).innerHTML = await request(arrow.getAttribute('href') ?? '')
  } catch {
    // The save worked, so there's nothing to report; the dialog stays on the saved episode and the arrow can be pressed again.
  }
}

/** @param {Document} document @param {Element} button */
const deleteEpisode = (document, button) => tryTo(document, 'delete', titleOf(document, 'episode[title]'), async () => {
  const { page, show_count, episode_count } = await request(button.getAttribute('href') ?? '', { method: 'DELETE' })
  dialog(document).innerHTML = page
  const footer = document.querySelector('.footer')
  if (footer) footer.textContent = `${show_count} TV Shows — ${episode_count} Episodes`
})

/** @param {Document} document */
const previewPoster = (document) => {
  const poster = field(document, 'input[name="season[poster]"]')?.value ?? ''
  dialog(document).querySelectorAll('.edit-poster img, #artwork img').forEach((img) => img.setAttribute('src', poster))
}

/** @param {unknown} error */
const serverMessage = (error) => {
  try {
    return JSON.parse(/** @type {{ body?: string }} */ (error).body ?? '').error
  } catch {
    return undefined
  }
}

/** @param {Document} document @param {HTMLInputElement} input */
const upload = async (document, input) => {
  const message = /** @type {HTMLElement} */ (dialog(document).querySelector('#artwork .artwork-message'))
  message.textContent = 'Uploading...'
  const { FormData, Event } = /** @type {Window & typeof globalThis} */ (document.defaultView)
  const body = new FormData()
  body.append('artwork', /** @type {FileList} */ (input.files)[0])
  try {
    const { url } = await request(input.dataset.upload ?? '', { method: 'POST', body })
    message.textContent = ''
    const poster = /** @type {HTMLInputElement} */ (field(document, 'input[name="season[poster]"]'))
    poster.value = url
    poster.dispatchEvent(new Event('change', { bubbles: true }))
  } catch (error) {
    message.textContent = serverMessage(error) || FALLBACK_UPLOAD_ERROR
  } finally {
    input.value = ''
  }
}

/** @param {Document} document @param {HTMLInputElement} button */
const setDefaultSeason = async (document, button) => {
  const { page, poster } = await request(`${button.form?.getAttribute('action') ?? ''}${button.value}`, { method: 'POST' })
  showSaved(document, page, poster)
}

/** @param {Document} document @param {string} html */
const openDialog = (document, html) => {
  dialog(document).innerHTML = html
  open(document, 'edit-show')
}

/**
 * Binds show edit: the drawer's edit link and season buttons, the edit dialog's controls, and Create New Show.
 * @param {Document} document
 */
export const init = (document) => {
  on(document, 'click', '.show-edit', async (event, link) => {
    event.preventDefault()
    openDialog(document, await request(link.getAttribute('href') ?? ''))
  })
  on(document, 'click', '.season-submit', (event, button) => {
    event.preventDefault()
    setDefaultSeason(document, /** @type {HTMLInputElement} */ (button))
  })
  on(document, 'click', '#create-new', async (event) => {
    event.preventDefault()
    const { page } = await request('/shows/new')
    closePanel(document)
    openDialog(document, page)
  })
  on(document, 'click', '#edit-show [data-tab]', (_event, tab) => {
    activate(tab)
    activate(dialog(document).querySelector(/** @type {string} */ (tab.getAttribute('href'))))
  })
  // Not the forms' submit: a form only submits on Enter when it has a single text field, and then posts natively.
  on(document, 'keydown', '#edit-show input[type="text"]', (event) => {
    const key = /** @type {KeyboardEvent} */ (event)
    // An input method's Enter picks the text being composed; a held key's repeats would save again before the first lands.
    if (key.key !== 'Enter' || key.isComposing || key.repeat) return
    event.preventDefault()
    ok(document)
  })
  on(document, 'click', '#edit-show #ok', () => ok(document))
  on(document, 'click', '#edit-show #cancel', () => close(document, 'edit-show'))
  on(document, 'click', '#edit-show .edit-next', (_event, arrow) => move(document, arrow))
  on(document, 'click', '#edit-show #add-new-episode', () => tryTo(document, 'save', titleOf(document, 'show[title]'), () => addEpisode(document)))
  on(document, 'click', '#edit-show #episode-delete', (_event, button) => deleteEpisode(document, button))
  on(document, 'change', '#edit-show input[name="season[poster]"]', () => previewPoster(document))
  on(document, 'change', '#edit-show input[name="artwork"]', (_event, input) => upload(document, /** @type {HTMLInputElement} */ (input)))
}

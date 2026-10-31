// @ts-check
import { on, onSubmit } from '#mmdb/events.js'
import { request, fields } from '#mmdb/request.js'
import { open, close } from '#mmdb/dialog.js'
import { closeMenu } from '#mmdb/navigation.js'

const CHECK_DELAY = 1500
const NEUTRAL = ['1px solid #cccccc', 'none']
const MATCH = ['1px solid #088000', '0 0 5px #088000']
const MISMATCH = ['1px solid #ff0000', '0 0 5px #ff0000']

/** @param {ParentNode} root @param {string} name */
const input = (root, name) => /** @type {HTMLInputElement} */ (root.querySelector(`input[name="${name}"]`))

/** @param {ParentNode} root @param {string} selector @param {boolean} visible @param {string} display */
const show = (root, selector, visible, display = 'block') => root.querySelectorAll(selector).forEach((el) => {
  /** @type {HTMLElement} */ (el).style.display = visible ? display : 'none'
})

/** @param {HTMLElement} field @param {string[]} look */
const mark = (field, [border, boxShadow]) => Object.assign(field.style, { border, boxShadow })

// Spread counts characters the way the server does; .length would count an emoji twice.
/** @param {string} password @param {string} confirm */
const passwordProblem = (password, confirm) =>
  [...password].length < 8 ? 'Use at least 8 characters' : password === confirm ? '' : 'Passwords do not match'

/** @param {HTMLElement} warning @param {string} problem */
const warn = (warning, problem) => {
  warning.textContent = problem
  warning.style.display = problem ? 'block' : 'none'
}

/** @param {Document} document */
const settings = (document) => /** @type {HTMLElement} */ (document.getElementById('logIn'))

/** @param {Document} document @param {boolean} disabled */
const holdUpdate = (document, disabled) => settings(document).querySelector('button[type=submit]')?.toggleAttribute('disabled', disabled)

/** @param {Document} document @param {HTMLFormElement} form @param {(url: string) => void} go */
const signIn = async (document, form, go) => {
  const filled = new URLSearchParams([...fields(form)].filter(([, value]) => value !== ''))
  if (!filled.has('username_email') && !filled.has('password')) return show(settings(document), '.login-errors', true)
  const response = await request('/sessions', { method: 'POST', body: filled })
  if (response.status === 'true') return go(`/u/${response.handle}`)
  show(settings(document), '.login-errors', true)
  form.reset()
}

/** @param {Document} document */
const currentChanged = (document) => {
  const dialog = settings(document)
  const hasCurrent = input(dialog, 'current').value !== ''
  holdUpdate(document, hasCurrent)
  if (hasCurrent) dialog.querySelectorAll('.confirmation input').forEach((field) => field.removeAttribute('disabled'))
  else {
    mark(input(dialog, 'confirm'), NEUTRAL)
    warn(/** @type {HTMLElement} */ (dialog.querySelector('#no-match')), '')
  }
}

/** @param {Document} document */
const confirmChanged = (document) => {
  const dialog = settings(document)
  const problem = passwordProblem(input(dialog, 'password').value, input(dialog, 'confirm').value)
  warn(/** @type {HTMLElement} */ (dialog.querySelector('#no-match')), problem)
  const matches = !problem && input(dialog, 'current').value !== ''
  show(dialog, '.confirmation > span', matches, 'inline')
  holdUpdate(document, !matches)
  mark(input(dialog, 'confirm'), matches ? MATCH : MISMATCH)
}

/** @param {Document} document @param {HTMLFormElement} form @param {{ theme?: string }} saved */
const save = async (document, form, saved) => {
  const response = await request(/** @type {string} */ (form.getAttribute('action')), { method: 'PUT', body: fields(form) })
  if (response.status === 'true') {
    const navbar = /** @type {HTMLElement} */ (document.querySelector('.navbar-text'))
    saved.theme = response.theme
    navbar.textContent = `Signed in as ${response.name}`
    return close(document, 'logIn')
  }
  const dialog = settings(document)
  show(dialog, '.login-errors', true)
  const current = input(dialog, 'current')
  current.value = ''
  current.focus()
  dialog.querySelectorAll('.confirmation input').forEach((field) => {
    const password = /** @type {HTMLInputElement} */ (field)
    password.value = ''
    password.disabled = true
    mark(password, NEUTRAL)
  })
  show(dialog, '.confirmation > span', false)
  holdUpdate(document, false)
}

/** @param {Document} document */
const checkRegistration = (document) => {
  const form = /** @type {HTMLElement} */ (document.querySelector('.registration'))
  const problem = passwordProblem(input(form, 'user[password]').value, input(form, 'confirm').value)
  show(form, '.confirmation > span', !problem, 'inline')
  form.querySelector('input[type=submit]')?.toggleAttribute('disabled', Boolean(problem))
  warn(/** @type {HTMLElement} */ (form.querySelector('#no-match2')), problem)
}

/**
 * @param {Document} document
 * @param {(url: string) => void} [go] where sign-in and Sign Out send the browser; tests pass a recorder, as jsdom can't navigate
 */
export const init = (document, go = (url) => /** @type {Window} */ (document.defaultView).location.replace(url)) => {
  /** @type {{ theme?: string }} */
  const saved = { theme: document.documentElement.dataset.theme }
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let registrationCheck

  on(document, 'click', '#open-sign-in', () => open(document, 'logIn'))
  on(document, 'submit', '#sign-in-form', onSubmit((document, form) => signIn(document, form, go), document))
  on(document, 'click', '#logout', async (event, link) => {
    event.preventDefault()
    await request(`/sessions/${link.getAttribute('href')}`, { method: 'POST' })
    go('/')
  })
  on(document, 'click', '#update', async (event, link) => {
    event.preventDefault()
    const content = /** @type {HTMLElement} */ (settings(document).querySelector('.modal-content'))
    content.innerHTML = await request(/** @type {string} */ (link.getAttribute('href')))
    open(document, 'logIn')
    closeMenu(document)
  })
  on(document, 'change', '#logIn input[name="current"]', () => currentChanged(document))
  on(document, 'input', '#logIn input[name="password"], #logIn input[name="confirm"]', () => confirmChanged(document))
  on(document, 'change', '#logIn input[name="theme"]', (event, radio) => {
    document.documentElement.dataset.theme = /** @type {HTMLInputElement} */ (radio).value
  })
  on(document, 'submit', '#logIn .login-form', onSubmit((document, form) => save(document, form, saved), document))
  on(document, 'input', '.registration input[name="user[password]"], .registration input[name="confirm"]', () => {
    clearTimeout(registrationCheck)
    registrationCheck = setTimeout(() => checkRegistration(document), CHECK_DELAY)
  })

  // close fires however the dialog was closed, Escape included, and only once its fade-out has run.
  settings(document)?.addEventListener('close', () => {
    const dialog = settings(document)
    const form = /** @type {HTMLFormElement | null} */ (dialog.querySelector('#sign-in-form'))
    form?.reset()
    show(dialog, '.login-errors', false)
    if (saved.theme) document.documentElement.dataset.theme = saved.theme
  })
}

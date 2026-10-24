// @ts-check

/**
 * Fetches from the app the way jQuery's $.ajax did: the routes answer XHR (request.xhr?) with partials or JSON.
 * @param {string} url
 * @param {{ method?: string, body?: BodyInit }} [options]
 * @returns {Promise<any>} parsed JSON for a JSON response, otherwise the response text
 */
export const request = async (url, { method = 'GET', body } = {}) => {
  const response = await fetch(url, {
    method,
    body,
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
  // The body rides along because some routes explain a refusal in it, such as an artwork upload's { error }.
  if (!response.ok) throw Object.assign(new Error(`${method} ${url} failed: ${response.status}`), { body: await response.text() })
  return response.headers.get('Content-Type')?.includes('application/json') ? response.json() : response.text()
}

// The form's own window's FormData, since the constructor rejects forms from another window (as in the tests).
// Files are dropped, as jQuery's serialize dropped them: a form body can only carry their name as "[object File]".
/** @param {HTMLFormElement} form */
export const fields = (form) => {
  const { FormData } = /** @type {Window & typeof globalThis} */ (form.ownerDocument.defaultView)
  return new URLSearchParams(/** @type {Array<[string, string]>} */ ([...new FormData(form)].filter(([, value]) => typeof value === 'string')))
}

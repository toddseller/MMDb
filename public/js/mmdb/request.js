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
  if (!response.ok) throw new Error(`${method} ${url} failed: ${response.status}`)
  return response.headers.get('Content-Type')?.includes('application/json') ? response.json() : response.text()
}

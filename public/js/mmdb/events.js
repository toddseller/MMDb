// @ts-check

/**
 * Listens on `root` for events from any element matching `selector`, including ones added later. Parts of the page
 * are replaced with server-rendered HTML, which would drop listeners bound to the elements themselves.
 * @param {Document | Element} root
 * @param {string} type
 * @param {string} selector
 * @param {(event: Event, element: Element) => void} handler
 */
export const on = (root, type, selector, handler) => {
  root.addEventListener(type, (event) => {
    // Duck-typed rather than instanceof Element, which is per-window (and absent in Node, where the tests run).
    const origin = /** @type {Element | null} */ (event.target)
    const target = origin && typeof origin.closest === 'function' ? origin.closest(selector) : null
    if (target && root.contains(target)) handler(event, target)
  })
}

/**
 * A handler for `on(document, 'submit', …)` that keeps the form from navigating and passes it to `handler`.
 * @param {(document: Document, form: HTMLFormElement) => void} handler
 * @param {Document} document
 */
export const onSubmit = (handler, document) => /** @param {Event} event @param {Element} form */ (event, form) => {
  event.preventDefault()
  handler(document, /** @type {HTMLFormElement} */ (form))
}

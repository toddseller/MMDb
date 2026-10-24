// @ts-check
// Bootstrap 3's modal runs on jQuery until change 7 replaces the dialogs and deletes this file.

/** @param {Document} document */
const jQuery = (document) => /** @type {Window} */ (document.defaultView).$

/** @param {Document} document @param {string} selector @param {'show' | 'hide'} action */
export const modal = (document, selector, action) => jQuery(document)(selector).modal(action)

/**
 * Bootstrap triggers its modal events through jQuery only, so addEventListener never hears them.
 * @param {Document} document
 * @param {string} selector
 * @param {'shown.bs.modal' | 'hidden.bs.modal'} type
 * @param {(dialog: HTMLElement) => void} handler
 */
export const onModal = (document, selector, type, handler) => jQuery(document)(selector).on(type, (event) => handler(event.currentTarget))

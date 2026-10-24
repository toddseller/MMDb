// @ts-check
import { JSDOM } from 'jsdom'

/**
 * A jsdom page for a module under test; modules take its document, so nothing touches Node's globals.
 * @param {string} html
 * @returns {{ window: Window & typeof globalThis, document: Document }}
 */
export const makePage = (html) => {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, { url: 'http://mmdb.test/' })
  return { window: /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ (dom.window)), document: dom.window.document }
}

/** @typedef {{ url: string, init: RequestInit }} FetchCall */

/**
 * Replaces fetch with a recorder so no test reaches the network.
 * @param {(url: string, init: RequestInit) => Response | Promise<Response>} respond
 * @returns {{ calls: FetchCall[], restore: () => void }}
 */
export const stubFetch = (respond) => {
  const original = globalThis.fetch
  /** @type {FetchCall[]} */
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init })
    return respond(String(url), init)
  }
  return { calls, restore: () => { globalThis.fetch = original } }
}

/** @param {unknown} body @param {number} [status] */
export const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** @param {string} body @param {number} [status] */
export const html = (body, status = 200) => new Response(body, { status, headers: { 'Content-Type': 'text/html' } })

/** @typedef {{ keyframes: Keyframe[], duration: unknown, onfinish: (() => void) | null, finish: () => void, cancel: () => void }} AnimationStub */

/**
 * Gives an element a recording el.animate and el.getAnimations; jsdom has neither. As in browsers,
 * a cancelled animation never runs its onfinish, and getAnimations lists only the running ones.
 * @param {HTMLElement} el
 * @returns {AnimationStub[]} every animation started on el, in order
 */
export const stubAnimate = (el) => {
  /** @type {AnimationStub[]} */
  const animations = []
  /** @type {Set<AnimationStub>} */
  const running = new Set()
  el.animate = /** @type {any} */ ((/** @type {Keyframe[]} */ keyframes, /** @type {unknown} */ duration) => {
    /** @type {AnimationStub} */
    const animation = {
      keyframes,
      duration,
      onfinish: null,
      finish: () => { if (running.delete(animation)) animation.onfinish?.() },
      cancel: () => { running.delete(animation) },
    }
    animations.push(animation)
    running.add(animation)
    return animation
  })
  el.getAnimations = /** @type {any} */ (() => [...running])
  return animations
}

/**
 * Gives a page's dialogs the showModal, close and getAnimations that jsdom lacks. As in browsers, closing an open
 * dialog fires close, and closing a closed one does nothing. Every dialog reports the animations in the returned list
 * as its own; other elements report none unless a test gives one its own getAnimations. As in browsers, `{ subtree: true }`
 * adds the descendants' and is needed for a pseudo-element's, such as `::backdrop`.
 * @param {Window & typeof globalThis} window
 * @returns {Animation[]} what a test pushes here is running on every dialog
 */
export const stubDialogs = (window) => {
  /** @type {Animation[]} */
  const running = []
  const dialog = window.HTMLDialogElement.prototype
  dialog.showModal = function () { this.open = true }
  dialog.close = function () {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new window.Event('close'))
  }
  window.Element.prototype.getAnimations = () => []
  dialog.getAnimations = function (options) {
    if (!options?.subtree) return running.filter((animation) => !(/** @type {KeyframeEffect | null} */ (animation.effect))?.pseudoElement)
    return [...running, ...[...this.querySelectorAll('*')].flatMap((element) => element.getAnimations())]
  }
  return running
}

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

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

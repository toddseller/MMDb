# Design

## Context

**Load order today.** `layout.erb` loads, in order, jQuery 1.9.1 (CDN), `bootstrap.min.js`, `mmdb.js` and `application.js`, each versioned by `asset_path` (`?v=<mtime>`). `application.js` calls `bindListeners()` and `dynamicListener()` on DOM ready. `mmdb.js` declares its state as top-level `var`s, so `filterValue`, `timeoutId` and `drawer` are properties of `window`.

**How the filters work today** (`mmdb.js`):
- **Search:** a delegated `keyup` on `#user-page` for `#search-movie-title` debounces `filterMovies` by 300ms.
  - `filterMovies` sets `filterValue`, takes the user id from the first `.index-preview` (saving it to `sessionStorage.id`), then requests `/<movies|shows>/filter?filter=…&id=…`.
  - It puts `response.page` into `#movie-list` and `"<count> Movies"` into `.footer`, then fades the footer in.
- **Unwatched and 4K:** handlers bound directly on `#unwatched` and `#four-k`.
  - Each toggles `active` between the two links and puts the plain HTML response into `#movie-list`.
  - They use the global `event` (the parameter is misspelled `evenet`).
- **Clear and Library:** `clearFilter`, bound delegated on `#clear-btn` and directly on `#library`.
  - It requests `/users/<sessionStorage.id>` and replaces `#user-page` with `response.page` and the footer count.
  - It resets `#filter-input`, closes the drawer at once and clears `active` and `filterValue`.

Replacing `#user-page` wipes the direct bindings on `#unwatched` and `#four-k`. After a Clear, those links fall back to a full page load of a URL that only answers XHR properly.

**Code that stays on jQuery for now:** other jQuery code reads `filterValue` (`submitUpdate`, `submitPreviewUpdate`, `deleteMovie`, `searchByName`). The drawer is the jQuery-side `window.drawer` until piece 2.

## Goals / Non-Goals

**Goals:**
- Implement the three spec deltas.
- Set up the module, import-map and unit-test conventions the later six changes follow.

**Non-Goals:**
- Any other feature.
- Removing jQuery or Bootstrap's JavaScript, which is piece 7.
- Helpers the filters don't use.
- A bundler or any build step.
- The broken `/shows/filter` search, which stays as it is.

## Decisions

**One specifier form, `#mmdb/<file>.js`, for both browser and Node.**
- `package.json` gains `"imports": { "#mmdb/*": "./public/js/mmdb/*" }`, so Node's test runner resolves the specifiers to the source files.
- The layout's import map resolves the same specifiers to versioned URLs in the browser.

Relative imports (`./request.js`) were the alternative, but they'd be fetched without a version and cached for four hours, which breaks `page-assets`.

**The import map is built from the directory.** `AssetHelper#import_map` lists `public/js/mmdb/*.js`, sorted, as `{ "imports": { "#mmdb/<file>": asset_path("/js/mmdb/<file>") } }` in JSON. `layout.erb` writes it raw (layouts may output raw HTML) in `<script type="importmap">`, before `<script type="module" src="<%= asset_path('/js/main.js') %>">`. A new module is versioned without anyone editing the layout. The map goes before any module script, as browsers require.

**Modules don't touch the page when imported.** Each exports functions. `main.js` is the only file with side effects: it calls each module's `init(document)`. Module scripts run after the document is parsed and before `DOMContentLoaded`, after the classic scripts have defined `window.drawer`. So `main.js` needs no ready handler.

**`request(url, options)`** wraps `fetch`:
- It sends `X-Requested-With: XMLHttpRequest`, which the routes check with `request.xhr?`, along with same-origin credentials.
- It returns parsed JSON when the response is JSON, and text otherwise.
- It throws an `Error` naming the status on a non-2xx response.

**`on(root, type, selector, handler)`:** one listener on `root`. It calls `handler(event, matched)` when `event.target.closest(selector)` is inside `root`. Filters bind on `document`, so they survive `#user-page` being replaced. That's the source of the Unwatched and 4K fix.

**`filters.js`** exports `init(document)` and the handlers it binds. The handlers take `document` so tests can drive them against jsdom.
- **Search:** debounced 300ms with `setTimeout`. It writes `window.filterValue` (read by code that's still jQuery, until pieces 3 and 4), keeps the `sessionStorage.id` behaviour, requests `/<movies|shows>/filter`, and replaces `#movie-list` and the footer count.
- **Unwatched and 4K:** prevent the default, toggle `active`, and replace `#movie-list` with the response text.
- **Clear and Library:** reset the form, call `window.drawer.close(true)` while the drawer is still jQuery code, clear `active` and `window.filterValue`, and replace `#user-page` and the footer count.
- **Footer:** shown by setting `style.display = ''`. The jQuery `fadeIn` used for this isn't kept; it's an interim cosmetic and the browser tests don't check it.

The matching jQuery bindings and functions (`filterMovies`, `unwatched`, `fourK`, `clearFilter`, and the `keyup` block) are removed from `mmdb.js`. `timeoutId` goes too. `filterValue` stays declared for the code that still reads it.

**Unit tests:**
- `node --test` over `spec/js/**/*.test.js`, with jsdom 30.1.3 pinned as a development dependency.
- `spec/js/dom.js` builds a jsdom page and exposes its `window` and `document`.
- Tests replace `globalThis.fetch` with a recorder that returns canned responses, so no test reaches the network.
- The debounce is tested with `node:test`'s mock timers.

**Types from JSDoc, checked by TypeScript, no build.**
- Every module and unit test starts with `// @ts-check` and declares its parameter and return types in JSDoc.
- `tsconfig.json` uses `allowJs`, `checkJs`, `noEmit` and `strict`, a `module` and `target` matching what browsers and Node run (ES2022 modules), and `paths` for `#mmdb/*`. That keeps imports typed the same way Node and the import map resolve them.
- It includes `public/js/main.js`, `public/js/mmdb/**/*.js` and `spec/js/**/*.js`, but not the legacy `mmdb.js`, `application.js` or Bootstrap. Reaching into the old code (`window.drawer`, `window.filterValue`) goes through a small declaration in `public/js/mmdb/legacy.d.ts` that types exactly those two globals. Each later piece deletes its entry when it takes that state over.
- `npm run typecheck` runs `tsc`. TypeScript 7.0.2 and the jsdom types come in as pinned development dependencies.
- Real `.ts` files were rejected: browsers can't run them, so they'd need a build step, which conflicts with serving versioned source files through the import map and with deploying by `git pull`.

**CI and the asset checks.**
- The `test` job runs `npm run typecheck` and then `npm test` right after `npm ci`, before installing Chromium. A type error or failing unit test skips the browser tests, and the Chromium download with them.
- `page_assets_spec.rb` changes too: it counts 5 versioned assets (with `main.js`), and gains checks for the import map.

## As built

- **No `paths` in `tsconfig.json`.** With `module` and `moduleResolution` set to `nodenext`, TypeScript resolves `#mmdb/*` through `package.json`'s `imports`, as Node does. `@types/node` 24.19.2 is pinned for `node:test` and `node:assert` in the unit tests.
- **The import map needed an escaping exception.** It must be output raw, since escaping turns its JSON quotes into `&quot;`, but `web-page-escaping` allowed raw output only for page content and partials. By decision, that requirement now also allows the layout's import map: server-built JSON of module file names, with no user data. `views_spec.rb` allows exactly `<%== import_map %>`, and a probe showed that other raw output still fails.
- **`on` checks for `closest()` instead of `instanceof Element`.** `Element` belongs to each window, and Node has no global `Element`, so the check would have failed under jsdom.
- **The type check earned its place straight away.** It caught a possibly-null element in a test, and a line beginning with a JSDoc-cast `(`. Without semicolons, that line would have run as a call on the line above.
- **Chromium resolves `#mmdb/…`** through the import map: the module was fetched at its versioned URL, with no console errors. No fallback was needed.
- **Counts:** RSpec 214 examples, 16 unit tests, 23 browser tests (including the new 4K-after-Clear test, which failed on the jQuery code). `mmdb.js` is 75 lines shorter.

## Risks / Trade-offs

- [A browser rejects `#`-prefixed specifiers in an import map] → Import maps treat any key that isn't URL-like as a bare specifier, so `#mmdb/…` should work. Tasks check it in Chromium early, and a fallback key prefix (`mmdb/…` in the browser, with Node `imports` needing `#`) is noted as the alternative if not.
- [Classic and module code share `window.filterValue` and `window.drawer`] → This is temporary and noted in the code with the piece that removes it.
- [The footer no longer fades in after a filter] → A cosmetic change only. Piece 2 brings a motion helper.
- [TypeScript 7 is the newer native compiler] → It still provides `tsc` with `checkJs`. Task 1.2 confirms the check runs and reports a deliberate type error before anything relies on it, with the last 6.x release as the fallback.
- [Unit tests in jsdom can't see layout or animation] → The browser tests still cover what the user sees. Unit tests cover request shapes, state and DOM updates.

## Migration Plan

Front end only, with versioned assets, so browsers pick up the change on the next page load. Roll back by reverting the commit.

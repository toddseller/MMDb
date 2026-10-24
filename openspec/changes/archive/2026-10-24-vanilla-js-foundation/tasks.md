# Tasks

## 1. Unit-test setup

- [x] 1.1 Add jsdom 30.1.3 to `package.json` as a development dependency, with `"imports": { "#mmdb/*": "./public/js/mmdb/*" }` and `"test": "node --test 'spec/js/**/*.test.js'"`. Add `spec/js/dom.js` (a jsdom page plus a recording `fetch` stub) and one test of the stub itself. Verify `npm test` runs it and passes
- [x] 1.2 Add TypeScript 7.0.2 and jsdom's types as development dependencies, a `tsconfig.json` per design.md (`allowJs`, `checkJs`, `noEmit`, `strict`, `paths` for `#mmdb/*`, only the new modules and `spec/js`), `public/js/mmdb/legacy.d.ts` for `window.drawer` and `window.filterValue`, and a `typecheck` script. Put `// @ts-check` and JSDoc types on `spec/js/dom.js`. Show `npm run typecheck` failing on a deliberate type error, remove the error, and verify it passes

## 2. Helpers

- [x] 2.1 Write `spec/js/request.test.js`:
  - it sends `X-Requested-With: XMLHttpRequest` and same-origin credentials
  - it returns parsed JSON for a JSON response and text otherwise
  - it throws naming the status on a 500

  Show it failing, then add `public/js/mmdb/request.js`, with JSDoc types, until it and `npm run typecheck` pass
- [x] 2.2 Write `spec/js/events.test.js`:
  - a handler bound on a root fires for a matching descendant added after binding
  - it gets the matched element
  - it doesn't fire for non-matching elements

  Show it failing, then add `public/js/mmdb/events.js`, with JSDoc types, until it and `npm run typecheck` pass

## 3. Versioned modules in the page

- [x] 3.1 Add checks to `page_assets_spec.rb`:
  - every page has an import map listing each `public/js/mmdb/*.js` as `#mmdb/<file>` mapped to `/js/mmdb/<file>?v=<version>`
  - a changed module's version changes while the others stay the same
  - `main.js` is loaded as a versioned module script after the map
  - 5 versioned assets in all

  Show them failing, then add `AssetHelper#import_map`, the two tags in `layout.erb`, and a `public/js/main.js` that only imports `#mmdb/events.js`. Verify the checks pass
- [x] 3.2 In Chromium, load a page and confirm `#mmdb/…` specifiers resolve through the import map with no module errors in the console. If they don't, switch to the fallback in design.md before going on

## 4. Filters

- [x] 4.0 Add a browser test that clicks Clear, then 4K, and expects only the 4K movie without leaving the page. Run it against today's jQuery code and show it failing, because Clear drops the 4K link's handler
- [x] 4.1 Write `spec/js/filters.test.js` against a jsdom collection page:
  - typing waits 300ms and makes one request to `/movies/filter` with the full text and the user id, then replaces the grid and footer count and sets `window.filterValue`
  - Unwatched and 4K request their link, replace the grid and swap `active`
  - Clear and Library reset the search, clear `active` and `window.filterValue`, call `window.drawer.close(true)`, and replace the page
  - Unwatched still works after the page is replaced

  Show it failing, then add `public/js/mmdb/filters.js`, with JSDoc types, and call its `init` from `main.js` until it and `npm run typecheck` pass
- [x] 4.2 Remove `filterMovies`, `unwatched`, `fourK`, `clearFilter`, `timeoutId`, the debounced `keyup` binding and the Unwatched, 4K, Library and Clear bindings from `mmdb.js`, keeping `filterValue` declared. Run all browser tests and verify all pass, including the 4K-after-Clear test from 4.0

## 5. CI and docs

- [x] 5.1 Add `npm run typecheck` and then `npm test` after `npm ci` in the `test` job of `.github/workflows/test.yml`, and verify the workflow lint passes
- [x] 5.2 Add a "Front-end modules and unit tests" note to `README.md`: where modules live, the `#mmdb/` specifier and the import map, JSDoc types with `npm run typecheck`, and `npm test`. Check the commands work as written
- [x] 5.3 Run the whole RSpec suite, `npm run typecheck`, `npm test`, `npx playwright test` and `openspec validate vanilla-js-foundation --strict`, and verify all pass

## Workflow follow-up

- Work on a feature branch, archive the change as the last commit of the PR, and open the PR with `gh`.
- After deploy, check on mmdb.online that the import map loads, the filters work, and the console shows no errors.

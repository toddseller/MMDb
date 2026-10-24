# Proposal

## Why

The front end runs on jQuery 1.9.1 and Bootstrap 3.3.6's JavaScript, both with known vulnerabilities. The plan is to replace `public/js/mmdb.js` (1,035 lines) with modern JavaScript, with no jQuery, in seven changes that can each be deployed on their own. The browser tests added in `add-e2e-tests` guard behaviour through all of them.

This first change lays the groundwork every later piece needs:
- how modules load and stay cache-safe
- shared helpers for requests, events, forms and motion
- a unit-test setup

It then rewrites the collection filters as the first real piece.

## What Changes

- **ES modules, versioned through an import map.** New modules live in `public/js/mmdb/`, loaded from `public/js/main.js` with `<script type="module">`. The layout writes an import map that sends each module specifier to its versioned URL, so a deploy can't mix a new module with a cached old one.
- **Shared helpers the filters need**, each unit-tested first:
  - `request`: `fetch` that marks requests as AJAX, the way the routes expect
  - `on`: delegated events

  Other helpers, such as form serialization or show and hide, come with the first later piece that uses them.
- **The filters move off jQuery:** the title search (with its pause before searching), Unwatched, 4K, Clear and Library. Their jQuery handlers are removed.
- **Bug fix:** after Clear, Unwatched and 4K kept working only by accident (a full page load). They now work through the page script.
- **Unit tests:** run with Node's test runner and jsdom (`npm test`), in the required `test` job before the browser tests.
- **Type checking without a build step:** modules carry JSDoc types under `// @ts-check`, and TypeScript checks them (`npm run typecheck`, `tsc --noEmit` with `checkJs`) in the `test` job before the unit tests. The files stay plain JavaScript and are served as written.
- **Interim links to the jQuery code:** the rest of the jQuery code keeps working. The filter module keeps the shared `filterValue` up to date and calls the jQuery drawer's close until those pieces move.

## Capabilities

### New Capabilities

- `collection-filters`: how the collection's title search, Unwatched, 4K, Clear and Library filters behave.

### Modified Capabilities

- `page-assets`: adds that script modules imported by the app's own scripts load from versioned URLs.
- `ci-test-gate`: adds that front-end unit tests and a type check of the script modules run in the gate.
- `web-page-escaping`: the raw-HTML rule also allows the layout's import map: server-built JSON of module file names, with no user data, which escaping would break.

## Impact

- **New files:**
  - `public/js/main.js`
  - `public/js/mmdb/request.js`, `events.js` and `filters.js`
  - unit tests in `spec/js/`
  - an import-map helper in `app/helpers/`
- **Changed:**
  - `app/views/layout.erb`: the import map and the module script
  - `public/js/mmdb.js`: the filter code removed
  - `package.json` and `package-lock.json`: jsdom, TypeScript, an `imports` entry, and `test` and `typecheck` scripts
  - `tsconfig.json` (new): type-check the JavaScript, emit nothing
  - `.github/workflows/test.yml`: `npm run typecheck` and `npm test` steps
  - `README.md`
- **The browser tests:** the 22 must pass unchanged. The filter tests are what show the rewrite kept the behaviour.
- No server routes, data or API changes.

# Tasks

Test-first throughout: write the test, run it and see it fail for the right reason (or, for characterization tests, pass on today's code), then make the smallest change that passes, then run the whole suite. myflix work is on the branch `modernize-myflix-client` in `~/Development/Myflix Projects/myflix`; this change's planning files are on the MMDb branch of the same name. Until group 4, tests run on today's stack (`CI=true yarn test --watchAll=false` in a `node:14` container); from group 4 on, `yarn test` on Node 24.

## 1. Branches

- [x] 1.1 Create `modernize-myflix-client` from `master` in both MMDb and myflix; verify `git status -sb` shows it in each

## 2. Record today's behavior (characterization, on the current stack)

- [x] 2.1 Add tests that pass on today's code: `LoginForm` submits `{ username_email, password, remember }` and shows `validate.js`'s messages for empty fields; `SearchBox` renders a text input and the search and add buttons and calls its handlers; `ToggleButton` falls back to the `default` theme for a non-string theme; each of `/`, `/login`, `/signup` renders its page. Verify they pass, along with the existing 5 tests
  - Note: found an existing bug: `validate.js` checks `userNameEmail` but the field is `username_email`, so an empty user name is never flagged and the form submits without it. Recorded as a characterization test; whether to fix it is the owner's call. Also, the `ToggleButton` test stands in for Material-UI's `isString` (same `typeof` check), because Jest can't load that ES-module internal.
- [x] 2.2 Take screenshots of today's home page, login page and search box on myflix.stream in Brave for the later comparison; verify the files are saved

## 3. Removals on the current stack (design decisions 5 to 8, 11)

- [x] 3.1 Replace Material-UI in `SearchBox`, `NewMediaPreview`, `ToggleButton` and `index.js` with plain elements and inline SVG icons (decision 7); verify the 2.1 `SearchBox` and `ToggleButton` tests and the whole suite pass, and `grep -rn material-ui src` finds nothing
- [x] 3.2 Replace redux-form in `LoginForm` with a plain React form and drop its reducer from the store (decision 6); verify the 2.1 `LoginForm` tests and the whole suite pass
- [x] 3.3 Replace `react-lazyload` with `loading="lazy"` in `MoviePreview` and `ShowPreview`, drop `forceCheck` from `UserPage`, and replace `recompose`'s `compose` with redux's (decisions 5 and 8); verify the existing `ShowPreview` tests and the whole suite pass
- [x] 3.4 Remove the packages in decision 11 that are now unused (Material-UI, redux-form, react-lazyload, recompose, the never-imported packages, the 2023 pins) and the `resolutions` block; verify `yarn install` succeeds, the whole suite passes, and the current production build still compiles
  - Note: the `node-releases` pin stays until 4.2; without it the Node 14 install pulls 2.0.60, which requires Node 18. The other resolutions were removed here. `history` was never a direct dependency (it comes with react-router) and goes in 5.2.

## 4. Toolchain and React (design decisions 1 to 3, 10)

- [x] 4.1 Rename the 26 JSX files to `.jsx` with `git mv`; verify `git status` shows renames only and the suite still passes on the current stack
  - Note: 34 files, not 26: the new tests, `icons` and the test helper contain JSX too.
- [x] 4.2 Switch to Vite 8 and Vitest on Node 24 together with React and React DOM 19 and Testing Library: `vite.config.js`, root `index.html`, scripts, `engines`, `.nvmrc`, `node-sass` to `sass`, and the two existing tests ported (decision 10); verify on Node 24 that `yarn test` passes all tests, `yarn build` writes `build/`, and no install warns about an unmet engine
  - Note: the config is `vite.config.mjs`, not `.js`: Vite warns that ES module syntax in a `.js` file loaded as CommonJS will stop working in a future version. React 19 also removed `ReactDOM.render`, so `index.jsx` uses `createRoot`.
- [x] 4.3 Change `frontend/Dockerfile`'s builder to `node:24-slim`; verify `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build` succeeds

## 5. Router 7 (design decision 4)

- [x] 5.1 Extend the 2.1 route tests: `/browse/:id` renders the user page; `router.navigate` from `startLogin` lands on `/browse/<id>`; the header's path tracking updates on navigation. Run them on react-router 7 before the router change and see the router tests fail
- [x] 5.2 Add `routers/router.jsx` with `createBrowserRouter`, render it through `RouterProvider`, switch `actions/auth.js`, `sessionExpiry`'s adapter in `index.jsx`, and `Header` (`router.subscribe`, unsubscribed on unmount) away from `history`, then remove the `history` package; verify 5.1 and the whole suite pass
  - Note: `history` was only a dependency of react-router 5 and left the lockfile with it. The header now starts from the current path instead of an empty one, so loading `/login` directly no longer shows a "Sign In" button there.

## 6. Remaining libraries (design decisions 5 and 9)

- [x] 6.1 Move redux to 5, react-redux to 9, redux-thunk to 3 (named `thunk`), reselect to 5, axios to the newest 0.x, and Font Awesome to its current majors, replacing `redux-devtools-extension` with the devtools hook; verify the whole suite passes and `yarn build` succeeds after each library
  - Note: a new `TopUserListItem` test showed that Font Awesome's old React component (0.1) crashes under React 19, so the home page's Top Users section was broken on this branch until Font Awesome 7 / react-fontawesome 3. axios stays on 0.x (0.34.0) as planned; 1.x is a later step. Bundle: 413 KB after 4.2, 488 KB after react-router 7, 547 KB (172 KB gzipped) after this group.
- [x] 6.2 Owner request: fix the login validation. Change the 2.1 characterization test for an empty user to expect "Required" under the user field and no submit, see it fail, then correct the field name in `validate.js`; verify the whole suite passes
- [x] 6.3 Owner request: move axios to 1.x; verify the whole suite passes, `yarn build` succeeds, and the bundle still targets `https://mmdb.online/api/v2` with the 401 interceptor
  - Note: axios 1.20.0. The bundle grew to 570 KB (181 KB gzipped), about 3 KB over today's live bundle. The minifier now writes strings with backticks, so bundle checks search for `myflixUser` without fixed quotes.
- [x] 6.4 Owner request: make the "Remember me" text toggle its checkbox. Add a test that clicking the label ticks the box, see it fail, then link the label to its input in `RenderField`; verify the whole suite passes
  - Note: pushed after the owner had merged #41, so it ships as its own pull request, Myflix #43.

## 7. Advisory check (spec: Releases carry no known-vulnerable dependencies where a fix exists)

- [x] 7.1 List the production bundle's packages from the build's source maps, and check every `name@version` in the final `yarn.lock` against GitHub's advisory database (decision 12); fix each match that has a published fix, then rerun the check on the resulting lockfile until no fixable match remains and none reaches the bundle; record any unfixable build-only match for the pull request
  - Note: 178 installed packages (from about 1,540 lockfile entries), 17 of them in the browser bundle; 0 advisory matches. The query was confirmed to report known-vulnerable versions (`axios@0.33.0`, `lodash@4.17.20`). Rerun after 6.2 and 6.3 on the final lockfile: 182 packages, 0 matches.

## 8. Release checks (spec: User-facing behavior is verified before release)

- [x] 8.1 Build the image as `linux/amd64`, serve it on `localhost:3000`, and verify in Brave: the home page loads its four sections from the live API with no console errors; reloading `/browse/1` directly works; posters carry `loading="lazy"`; titles with `&` read correctly; compare the 2.2 screenshots and report the bundle size before and after
  - Results: home page four sections and Top Users (Font Awesome icons) with no console errors; direct reload of `/browse/1` works; 4,526 movies and 859 shows with `loading="lazy"` (81 posters loaded on first screen); titles with `&` read correctly; search box computed styles identical to the recorded live ones. Bundle: 570 KB JS (181 KB gzipped) and 14.6 KB CSS, against live 573 KB (176 KB gzipped) and 13.8 KB.
  - Found and fixed: react-scripts 3's minifier had compiled four "Retina" media queries to an empty `@media`, so `max-width: 1560px` and `right: 9.4vw` applied on every screen; Vite scoped them correctly and moved the search bar. The base rules now carry those values; measured layout (search bar, lists, first tiles, header, avatar) is identical to myflix.stream in the same window.
- [x] 8.2 Have the owner log in on `localhost:3000` with "Remember me" and check the collection's movies and TV shows tabs; verify the login is stored in `localStorage`
  - Result: after a "Remember me" login on the production image, the login is in `localStorage` and the collection (4,526 movies) loads. An earlier login without the box ticked went to `sessionStorage`, as intended.

## 9. Test gate (spec: Changes reach master only through a passing test run; design decision 13)

- [x] 9.1 Add `.github/workflows/test.yml` to myflix (decision 13); verify the YAML parses and the same commands (`yarn install --frozen-lockfile`, `yarn test`, `yarn build`) pass in a `node:24-slim` container
- [x] 9.2 Commit and push the myflix branch, and open its pull request with `gh`; verify with `gh pr checks` that the `test` check passes
- [x] 9.3 Owner creates the Myflix ruleset on GitHub, with the same steps as MMDb's: Settings, Rules, Rulesets, New branch ruleset; name `master requires tests`; enforcement Active; target the default branch; bypass list Repository admin; "Require a pull request before merging" and "Require status checks to pass" with the `test` check. Verify `GET /repos/toddseller/Myflix/rules/branches/master` lists `pull_request` and `required_status_checks` with `test`
- [x] 9.4 Open a throwaway pull request based on this branch whose only commit makes one test fail; verify the `test` check fails and GitHub reports the merge as blocked, then close it with `gh` and delete its branch
  - Result: Myflix #42 failed `test` in 19s and GitHub reported it `BLOCKED` (mergeable otherwise); closed unmerged, branch deleted.

## 10. Ship

- [x] 10.1 Have the owner merge the myflix pull request with its passing `test` check
  - Result: merged as Myflix #41 (`6d77318`), with every task above except 6.4, which follows in #43.
- [x] 10.2 Deploy myflix (back up `~/myflix`, tag the image `myflix-nginx:before-modernize`, copy `frontend/` and `docker-compose.yml`, `docker compose up -d --build`); verify myflix.stream in Brave with the owner's stored login, and that GitHub's open Myflix alerts drop to the unfixable ones recorded in 7.1
  - Result: deployed `350fd6b` (Myflix #41 and #43). The old `frontend/` was moved aside to `frontend.old`, because copying over it would have left stale `.js` files that Vite resolves before `.jsx`. myflix.stream serves the new bundle with the owner's stored login; GitHub reports 0 open Myflix alerts (from 249 this morning).
- [x] 10.3 Commit this change on the MMDb branch, archive it as the last commit (sync `myflix-client-build` into a new main spec, move the change to the archive), open the MMDb pull request with `gh`, and verify its `test` check passes

## Workflow follow-up

- The owner merges the MMDb pull request (planning files only; no deploy).
- Dependabot closes Myflix #33 to #35 and #38 once `master` no longer has the old versions.

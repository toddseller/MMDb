# Design

## Context

See proposal.md for why and specs/myflix-client-build for the release requirements. Found while planning (myflix `frontend/client`, 52 source files, 1,734 lines, 20 style files):

- 13 class components; no `findDOMNode`, string refs or `componentWill*` lifecycles, so React 19 needs no component rewrites. No component reads route params or `history` from props.
- Routing: `routers/AppRouter.js` builds a `history` with `createBrowserHistory` and renders `<Router history>` with `<Switch>` and four `<Route component>` entries (`/`, `/login`, `/signup`, `/browse/:id`). That `history` is also used by `actions/auth.js` (`push` after login), `apis/sessionExpiry.js` (passed in from `index.js`) and `header/Header.js` (`history.listen` to track the current path).
- Store: `createStore` with `combineReducers` (nine reducers plus redux-form's), thunk, and `redux-devtools-extension/developmentOnly`.
- Material-UI in 4 files: `index.js` (`MuiThemeProvider`), `searchbox/SearchBox.js` (`TextField`, two `IconButton`s, Search and Add icons), `NewMediaPreview` (Add icon at 5rem), `ToggleButton` (`isString` imported from a Material-UI internal path).
- redux-form only in `forms/LoginForm.js` (with `RenderField.js` and `validate.js`) and the store; `Signup.js` is a static page.
- react-lazyload in `MoviePreview`, `ShowPreview` and `UserPage` (`forceCheck` after updates).
- No `process.env` use and no Sass `@import`s; 26 source files contain JSX but use the `.js` extension.
- `frontend/Dockerfile` builds with `node:14-buster-slim` and copies `/app/build` into `nginx:alpine`; `nginx.conf` already has `try_files $uri /index.html`. `node:24-slim` (Node 24.22.1) ships Yarn 1.22.22.
- MMDb's CORS allows `localhost:3000`, which the local checks rely on.

## Goals / Non-Goals

**Goals:**
- Current, supported versions of the toolchain and libraries, with the smallest code changes that get there.
- No visible change except the search box styling.

**Non-Goals:**
- Hooks rewrites, TypeScript, Redux Toolkit, CSS refactoring.

## Decisions

**1. Vite 8 with `@vitejs/plugin-react`.** `index.html` moves to the client root with `<script type="module" src="/src/index.jsx">` and `/`-relative asset paths instead of `%PUBLIC_URL%`; `public/` keeps the static images and manifest. `vite.config.js` sets `build.outDir: 'build'`, so the Dockerfile's copy path stays, and `server.port: 3000`, which MMDb's CORS already allows. Scripts: `start` = `vite`, `build` = `vite build`, `test` = `vitest run`, `preview` = `vite preview`. *Alternative:* react-scripts 5. Rejected: deprecated, still webpack 5 and Jest 27, and it would carry over most of today's build-time alerts.

**2. JSX files renamed to `.jsx`.** The 26 files that contain JSX are moved with `git mv` so history follows them; imports omit extensions and keep resolving. *Alternative:* configuring Vite to parse JSX in `.js`. Rejected: non-standard, and the option differs between Vite's transformers across versions.

**3. Node 24 LTS everywhere.** `package.json` `engines.node` is `>=24`, `.nvmrc` holds `24`, and the Dockerfile's builder becomes `node:24-slim`. Node 26 is newer but not yet LTS. Yarn 1 and the existing `yarn.lock` format stay.

**4. react-router 7 data router, navigable from outside components.** A new `routers/router.jsx` creates `router = createBrowserRouter([...])`: one root route whose element renders the header, an `<Outlet />` and the footer, with the four pages as children. `AppRouter` renders `<RouterProvider router={router} />`. Code outside components navigates with `router.navigate(path)`: `actions/auth.js` directly, and `sessionExpiry` through a `{ push: path => router.navigate(path) }` adapter passed in `index.jsx`, so its interface and tests stay as they are. `Header` replaces `history.listen` with `router.subscribe` in `componentDidMount`, and unsubscribes in `componentWillUnmount`, which today never happens. The `history` package is removed. *Alternative:* `unstable_HistoryRouter` with the existing `history`. Rejected: an unstable API that depends on a package react-router no longer needs.

**5. Redux family on current majors, same structure.** redux 5, react-redux 9, redux-thunk 3 (named export `thunk`), reselect 5. The store keeps `createStore` (still exported by redux 5, only marked as legacy) and drops redux-form's reducer. Devtools use `window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` when `import.meta.env.DEV`, replacing `redux-devtools-extension`. `recompose`'s `compose` in `UserPage` becomes redux's `compose`. *Alternative:* Redux Toolkit. Rejected for now: a rewrite of every reducer for no user-visible gain.

**6. Login form as a plain React form.** `LoginForm` keeps its markup and calls `onSubmit({ username_email, password, remember })` exactly as redux-form did, holding values in component state, with `validate.js`'s rules (corrected to check `username_email`) shown through `RenderField` after a field is touched or on submit. Nothing else used redux-form.

**7. Material-UI replaced by plain elements.** `SearchBox` uses an `<input>` and two `<button>`s styled in its existing SCSS to match today's size and placement; the Search and Add icons become small inline SVG components using Material Icons' path data (Apache 2.0 licensed), and `NewMediaPreview` uses the same Add icon at 5rem. `ToggleButton` uses `typeof theme === 'string'`. `index.jsx` drops `MuiThemeProvider`.

**8. Native lazy loading.** `MoviePreview` and `ShowPreview` render `<img loading="lazy">` with their existing width and height instead of `<LazyLoad>`; `UserPage` drops `forceCheck`.

**9. Sass, Font Awesome, axios on current versions.** `node-sass` → `sass` (Vite compiles `.scss` with it directly). Font Awesome's three packages move to their current majors; the `TopUserListItem` usage (`library.add`, three solid icons) is checked against them, and the icons become inline SVGs like decision 7 if the API no longer fits. axios moves to 1.x at the owner's request (first planned as the newest 0.x); the app uses only `axios.create`, `get`/`post`/`put`, `defaults.headers.common` and response interceptors, which 1.x keeps.

**10. Tests on Vitest with Testing Library.** Vitest with the `jsdom` environment and `@testing-library/react`. React 19 removed `ReactDOM.render` and `react-dom/test-utils`, so `ShowPreview`'s test renders with Testing Library; assertions stay the same. `sessionExpiry`'s test needs only the imports from Vitest.

**11. Packages removed.** `@material-ui/core`, `@material-ui/icons`, `@material-ui/lab`, `redux-form`, `redux-form-material-ui`, `react-lazyload`, `recompose`, `history`, `redux-devtools-extension`, `react-scripts`, `node-sass`, `react-swipeable-views`, `react-tap-event-plugin`, `react-transition-group`, `@optimizely/optimizely-sdk`, and the 2023 direct pins `eventsource`, `immer`, `json-schema`, `json5`, `loader-utils`, `merge-deep`, `minimist`, `serialize-javascript`, `shell-quote`, `url-parse`. The `resolutions` block from #37 is removed with them; anything still needed afterward is decided by decision 12.

**12. Advisory check against the final lockfile, with GitHub's advisory database.** Dependabot only reports on the default branch, so before release every `name@version` in the final `yarn.lock` is checked against GitHub's global advisory database (`GET /advisories?ecosystem=npm&affects=...`), and the production bundle's packages are listed from the build's source maps. The check runs again after each dependency change. A match with a published fix is updated, by a version bump or a resolution, before release; matches without a fix are listed in the pull request.

**13. A `test` workflow and a ruleset, mirroring MMDb's.** `.github/workflows/test.yml` has one job named `test`, since the ruleset matches checks by name. It uses `actions/checkout@v7` and `actions/setup-node@v7`, takes the Node version from `frontend/client/.nvmrc`, caches Yarn by `frontend/client/yarn.lock`, and runs `yarn install --frozen-lockfile`, `yarn test` and `yarn build` in `frontend/client`, with `permissions: contents: read` and an older run per branch cancelled when a new one starts. The workflow is added on this change's branch, so the modernization pull request runs it; the owner then creates the ruleset (require a pull request, require the `test` check, repository admins may bypass, branches don't need to be up to date), and the modernization pull request merges behind it. *Alternative:* adding the workflow to `master` first, as its own pull request. Rejected: it would test the old stack, which this change replaces.

## Risks / Trade-offs

- [Search box styling differs from Material-UI's] → styled to match size and placement; compared in screenshots before and after.
- [react-router 7's data router runs class components under a different context] → no component reads router props; navigation and the header's path tracking go through the router object, covered by the behavior checks.
- [Vite 8 and React 19 are recent] → the release requirements' build, test and live-API checks run before merge; the old image is tagged for instant rollback.
- [Dart Sass warns about deprecated syntax in old stylesheets] → warnings, not errors; fixing them is outside this change.
- [Bigger initial download if Vite's chunking differs] → the bundle size is compared before and after and reported.

## Migration Plan

Open the myflix pull request so the new workflow runs, have the owner create the Myflix ruleset once the `test` check has run, and merge the pull request behind it. Then, on the server: back up `~/myflix`, tag the current image `myflix-nginx:before-modernize`, copy `frontend/` and `docker-compose.yml`, and run `docker compose up -d --build`. Check myflix.stream in Brave as in the release requirements. Rollback: `docker tag myflix-nginx:before-modernize myflix-nginx:latest && docker compose up -d` (no rebuild).

# Proposal

## Why

The myflix React app (myflix.stream) runs on Node 14, React 16 and react-scripts 3, all long out of support; react-scripts (Create React App) has been deprecated since 2025. After `security-dependency-updates` (Myflix #37) it still has 85 open Dependabot alerts, 1 critical, and every remaining one is in tooling that only a major upgrade replaces: the node-sass chain, the webpack 4 development server, and the react-scripts 3 CSS and image pipeline. Two new axios alerts appeared as soon as #37 merged. Patching around the old stack has reached its limit; moving to current, supported versions removes the alerts and keeps the app maintainable.

## What Changes

- **BREAKING (build):** react-scripts 3 is replaced by Vite 8; the app builds and tests on Node 24 LTS, and the Docker build image moves from `node:14` to `node:24`. `yarn start`/`yarn build`/`yarn test` keep their names.
- React and React DOM 16 → 19; react-router-dom 5 → 7; redux 4 → 5, react-redux 7 → 9, redux-thunk 2 → 3, reselect 4 → 5; axios 0.x → 1.x; Font Awesome to its current major.
- `node-sass` is replaced by `sass` (Dart Sass).
- Jest via react-scripts is replaced by Vitest with Testing Library; the existing 5 tests keep their assertions.
- **Material-UI is removed:** the search box uses a plain input and buttons, and the Add and Search icons become inline SVGs; the theme provider and an internal Material-UI helper used for a string check go away.
- `redux-form` is removed: the login form becomes a plain React form with the same fields, validation and "Remember me". Its existing bug is fixed: `validate.js` checked `userNameEmail` instead of the `username_email` field, so an empty user name was never flagged.
- `react-lazyload` is removed: posters use native `loading="lazy"`.
- 15 packages that nothing imports are removed, including the 9 security pins added as direct dependencies in 2023, `react-swipeable-views`, `react-tap-event-plugin`, `@material-ui/lab` and the Optimizely SDK; `recompose` is replaced by redux's `compose`.
- A GitHub Actions workflow in myflix runs the tests and the production build on Node 24 for every pull request to `master` and every push to `master`; a ruleset on `master`, set by the owner, requires a pull request and that check. The modernization pull request itself is the first to merge behind it.
- What users see and can do stays the same, apart from the search box's styling.

Out of scope: TypeScript, Redux Toolkit, converting class components to hooks, and moving myflix to `git pull` deploys.

## Capabilities

### New Capabilities
- `myflix-client-build`: how the myflix client is built and shipped: on a maintained Node LTS release, with a production bundle free of known-vulnerable dependencies at release, with the app's user-facing behavior verified before each release, and every change tested before it reaches `master`.

### Modified Capabilities
None. `myflix-client-security` (sign-out on a 401, titles shown as text) keeps its requirements; its tests move to Vitest unchanged in substance.

## Impact

- myflix (`~/Development/Myflix Projects/myflix`, GitHub `toddseller/Myflix`): `frontend/client/package.json` and `yarn.lock`, a new `vite.config.js` and root `index.html` (replacing `public/index.html`), the 26 source files that contain JSX renamed to `.jsx`, the router, store, header, login form, search box, preview components and toggle button, the tests, `frontend/Dockerfile`, and a new `.github/workflows/test.yml`.
- GitHub: a ruleset on Myflix `master` requiring a pull request and the `test` check, created by the owner.
- Production: myflix-nginx is rebuilt from the new image; `nginx.conf` already falls back to `index.html` for client-side routes. MMDb, its APIs and its CORS settings are unchanged.

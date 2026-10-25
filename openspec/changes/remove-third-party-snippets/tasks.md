# Tasks

Each code task is test-first: write the check, run it and see it fail for the reason the task names, make the smallest change that passes, then run the whole suite.

## 1. Branch

- [x] 1.1 Create the `remove-third-party-snippets` branch from an up-to-date `master` and verify `git branch --show-current` names it

## 2. Remove the snippets

- [x] 2.1 Add a layout check to `spec/views_spec.rb` (or a new `spec/layout_spec.rb`): a rendered page's every `<script>` is the import map or has a `src` starting `/js/`, it has no `<iframe>`, and its HTML doesn't mention `googletagmanager`, `google-analytics` or `optimizely`. Verify it fails on the current layout for all three snippets
- [x] 2.2 Change `e2e/smoke.spec.js` to expect no request to any host but the app (instead of expecting `www.googletagmanager.com` to be blocked); verify it fails on the current layout because the page asks for Tag Manager and Optimizely
- [x] 2.3 Delete the Google Tag Manager script, the Optimizely script and the Tag Manager `<noscript>` iframe from `app/views/layout.erb`; verify both checks and the full suites pass (`bundle exec rspec`, `npm test`, `npm run typecheck`, `npx playwright test`)

## 3. Review before committing

- [x] 3.1 With the local server, take before and after screenshots of the movies page and the sign-in dialog in both themes at desktop and phone width. For "before", run the page with Optimizely's dark variation forced (the injected `/css/dark.css` added), so the difference a light-theme visitor in that variation will see is shown; show them to the user and get approval
- [x] 3.2 Run `/ponytail:ponytail-review` on the diff and resolve its findings before the first commit

## Workflow follow-up

- Commit on the branch, archive the change in the same PR, and open the PR with `gh`; the user merges it.
- After the release, from a fresh browser on mmdb.online: the page requests no host but mmdb.online, the poster image hosts and Cloudflare's beacon; the light theme has only the light stylesheet; the Remember me box lines up with the fields in both themes.

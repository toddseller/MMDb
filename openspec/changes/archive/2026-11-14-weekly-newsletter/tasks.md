# Tasks

## 1. Package and container

- [x] 1.1 Create `newsletter/` with `package.json` (`type: module`; scripts `test` = `node --import tsx --test 'test/**/*.test.ts*'`, `typecheck` = `tsc --noEmit`, `preview` = `email dev --dir src/emails`), a `tsconfig.json` with `jsx: react-jsx` and strict mode, and the dependencies from the proposal at pinned versions; verify `npm ci`, `npm test` (no tests yet) and `npm run typecheck` succeed in `newsletter/`
- [x] 1.2 Add `newsletter/Dockerfile` on `node:24-slim` pinned by digest, installing production dependencies and running `tsx src/main.ts` as the non-root `node` user; add `newsletter/node_modules` handling to `.dockerignore` and `newsletter/issues/` to `.gitignore`; verify `docker build newsletter` succeeds and `git status` doesn't show a test file written to `newsletter/issues/`
- [x] 1.3 Add the `newsletter` service to `docker-compose.yml` under `profiles: [newsletter]`, with `env_file: .env`, the `TAUTULLI_KEY`, `TMDB_TOKEN`, `RESEND_API_KEY` and `RESEND_SEGMENT_ID` variables, `TZ=America/Los_Angeles`, and `./newsletter/issues:/issues`; verify `docker compose config --services` lists only `web`, `docker compose --profile newsletter config --services` lists both, and `docker compose run --rm --build --entrypoint node newsletter -e "console.log(new Date().toString())"` prints a Pacific time
- [x] 1.4 Add `newsletter/systemd/mmdb-newsletter.service` (oneshot, `WorkingDirectory=%h/MMDb`, `docker compose run --rm --build -T newsletter`) and `mmdb-newsletter.timer` (`OnCalendar=Sun *-*-* 00:00:00 America/Los_Angeles`, `Persistent=true`); verify `systemd-analyze calendar --iterations=3 'Sun *-*-* 00:00:00 America/Los_Angeles'` on onyx lists the next Sundays at 08:00 UTC (07:00 UTC in daylight time) and `systemd-analyze verify` accepts both files there

## 2. Gathering the week's additions

- [x] 2.1 Test first, then write a Tautulli client that asks `get_recently_added` (no `section_id`) for 100 items, doubles the count while the whole list is inside the 7-day window, ends the list at the first older item and keeps libraries 1 and 2, with a fetch stub that fails on any unstubbed URL; verify tests cover an item on each side of the cutoff, no `section_id` sent, another library dropped, a window longer than the first request, and a Tautulli error failing the run
- [x] 2.2 Test first, then write the grouping of items into cards (movie on its own key; show, season and episode on the show's key) with the label rules from design.md; verify tests cover 8 episodes giving "8 new episodes", 1 giving "1 new episode", a season giving "Season 3", two seasons, a `show` item giving "New series", season plus episodes, and newest-first order within movies and within TV
- [x] 2.3 Test first, then fill in each card's title, year, Plex link and poster from `get_metadata` and TMDB `/movie/{id}` or `/tv/{id}` (bearer `TMDB_TOKEN`, 5-second timeout); verify tests cover the poster URL format, the backdrop URL format, the newest addition with a backdrop becoming the hero and leaving its grid (movie or show), no hero when the newest addition has no backdrop, a season card using the show's guid and never the season's, a missing `tmdb://` guid and a TMDB error each giving a card without a poster, and the Plex deep link built from `get_server_identity`

## 3. The email and its browser copy

- [x] 3.1 Test first, then build the `Issue` React Email component (headline, hero with backdrop and Play button, movies and TV sections, cards with poster, title, label and Plex link, "View in browser" and the unsubscribe link only when their props are set, the shared footer) with `PreviewProps`; verify rendered-HTML tests find each card's link and poster, find the view and unsubscribe links in the email render and neither in the web render; then run `npm run preview`, screenshot the issue in light and dark mail themes and get the owner's approval of the layout
- [x] 3.2 Test first, then write template selection and its data file (one regular template, the Christmas window Dec 1 to 26 with one template), with the shared cards, links and footer split out of `Issue` so every template reuses them; verify tests cover two regular templates alternating, the last Sunday of December and the first of January getting different templates outside a window, Dec 1, Dec 13, Dec 25 and Dec 26 choosing Christmas, Nov 30 and Dec 27 choosing a regular template, a two-template holiday alternating, and one regular template always chosen
- [x] 3.3 Test first, then build the Christmas template on the shared components with `PreviewProps`; verify the same rendered-HTML checks as 3.1 pass for it, then screenshot it in the preview server in light and dark mail themes and get the owner's approval
- [x] 3.4 Test first, then write the issue-page writer: name `<YYYY-MM-DD>-<8 base64url chars>.html` in the issues folder, written before anything is sent; verify tests cover the name format, two runs on the same day giving different names, and a write failure stopping the run before the send

## 4. Sending

- [x] 4.1 Test first, then write the run: gather, skip when there are no cards, choose the template for the run date, write the page, create the broadcast for `RESEND_SEGMENT_ID` from `MYFLIX Newsletter <info@myflix.stream>` with the subject `Recently added to MYFLIX (<date>)` and the email HTML (with `viewUrl` `https://myflix.stream/newsletter/<name>` and `{{{RESEND_UNSUBSCRIBE_URL}}}`), then send it; verify tests with a stubbed Resend cover an empty week sending nothing and writing nothing, a normal week writing one page and creating and sending one broadcast with the page's URL in its HTML, a Monday rerun still covering the week from the Sunday before last, and a Resend error failing the run with a non-zero exit
- [x] 4.2 Run `npm run typecheck` and `npm test` in `newsletter/` and the repo's full suites (`bundle exec rspec`, `npm run typecheck`, `npm test`); verify all pass

## 5. CI and dependency updates

- [x] 5.1 Test first in `spec/dependency_updates_spec.rb` (or the spec that reads `test.yml`), then update `.github/workflows/test.yml`: the `image` job also runs `docker build newsletter`, and the `unit` job runs `npm ci`, `npm run typecheck` and `npm test` in `newsletter/`; verify the spec passes and `actionlint` is clean
- [x] 5.2 Add npm and Docker entries for `directory: /newsletter` to `.github/dependabot.yml`, grouped like the root ones; verify the dependency-updates spec covers and passes them

## 6. Docs

- [x] 6.1 Document the newsletter in `DOCKER_DEPLOYMENT.md` (service, profile, the Pacific timezone, installing the timer with `systemctl --user link` and `enable --now`, `daemon-reload` after edits, reading runs with `journalctl --user -u mmdb-newsletter`, creating `newsletter/issues` before first run, the shared path with myflix, a manual run against a test segment) and the new keys in its API keys list and `.env.example`; add a short README section; verify every documented command runs as written locally (`docker compose run --rm --build newsletter` against stubs is not required, `docker compose --profile newsletter config` is)

## 7. Integration (owner, on onyx and in Resend)

- [ ] 7.1 Open the myflix PR adding `- ../MMDb/newsletter/issues:/usr/share/nginx/html/newsletter:ro` to its nginx service, with a note in its deploy docs; verify after its deploy that a hand-placed `test.html` in `~/MMDb/newsletter/issues` loads at `https://myflix.stream/newsletter/test.html`, then delete it
- [ ] 7.2 After release: create `~/MMDb/newsletter/issues`, add `RESEND_API_KEY` (Full access) and `RESEND_SEGMENT_ID` to the server `.env`, and create the live segment (the 8 Tautulli recipients) and a test segment (owner only) in Resend; verify `docker compose run --rm --build -e RESEND_SEGMENT_ID=<test> newsletter` delivers an issue whose "View in browser", unsubscribe and Plex links all work and whose footer shows the reader's own address 
- [ ] 7.3 Turn off Tautulli's newsletter and install the timer on onyx as `DOCKER_DEPLOYMENT.md` describes; verify `systemctl --user list-timers` shows `mmdb-newsletter.timer` next firing Sunday 00:00 Pacific, and the first Sunday's run shows a sent broadcast in `journalctl --user -u mmdb-newsletter`

## Workflow follow-up

- Run the ponytail review on the uncommitted diff before the first commit, then commit the code and archive the change in the same PR (`Archive weekly-newsletter`).
- Group 7 happens after merge and release; it doesn't block the PR.

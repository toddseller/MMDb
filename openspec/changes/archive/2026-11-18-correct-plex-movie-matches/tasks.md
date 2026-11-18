# Tasks

## 1. Plex ID column

- [x] 1.1 Add a migration with an indexed integer `plex_key` on `movies` and `shows`, update `db/structure.sql`, and verify `rake db:migrate` runs and the whole suite passes

## 2. Webhook imports

- [x] 2.1 In `spec/plex_import_spec.rb`, add failing tests for the `plex-webhook` scenarios "Another user stored the movie first", "Movie already in the collection", "New movie" and "Nothing imported". Make `Movie.plex_add` find or create, link the user and store `ratingKey`, and verify the whole suite passes
- [x] 2.2 Add a failing test for the "Single episode" scenario and a show-level one. Make `Show.plex_add` store `ratingKey` or `grandparentRatingKey` on the show, and verify the whole suite passes

## 3. Backfill

- [x] 3.1 Add failing specs (Tautulli stubbed with WebMock) for the backfill scenarios in `plex-library-sync`: name and year agree, show a year apart, already linked, lone namesake (Madden), two namesakes, report lines, Tautulli unreachable
- [x] 3.2 Implement the backfill and `rake plex:link`, and verify the 3.1 specs, the whole suite and `bundle exec rake -T` listing the task

## 4. Hourly pass: movies, then episodes

- [x] 4.1 Add failing specs (Tautulli and search stubbed) for the pass scenarios: match fixed, title changed, Plex agrees, older addition, replacement found, search finds nothing, webhook missed, report lines, Tautulli unreachable
- [x] 4.2 Implement the pass and `rake plex:sync`, and verify the 4.1 specs and the whole suite pass
- [x] 4.3 Add failing specs (Tautulli, Apple and TMDB stubbed) for the episode retry scenarios: show not found at first, source didn't list the episode yet, episode present (linked and unlinked-by-name show), older episode, still missing
- [x] 4.4 Add the episode retries to `plex:sync`, and verify the 4.3 specs and the whole suite pass

## 5. Schedule and docs

- [x] 5.1 Add `systemd/mmdb-plex-sync.service` and `systemd/mmdb-plex-sync.timer` at the repo root, modelled on the newsletter units (hourly, `Persistent=true`, waits for Docker, `docker compose exec -T web ... < /dev/null`), and verify `systemd-analyze verify` on onyx accepts them
- [x] 5.2 Document the backfill run, the timer install, a manual pass run and the `journalctl` check in `DOCKER_DEPLOYMENT.md`, plus a short README note, and verify the commands match the task and unit names

## Workflow follow-up

- Run the `ponytail:ponytail-review` skill on the uncommitted diff in a fresh subagent before the first commit.
- Commit the code, then archive the change as `Archive correct-plex-movie-matches` in the same PR.
- After the deploy (by 2026-11-24), run `rake plex:link` on onyx and check its report shows Madden (2023) linked to Plex's Madden (2026). Give the owner the report.
- Owner links and enables the timer and starts the service once. Check journalctl shows Madden (2026) added and Madden (2023) removed, the owner's MMDb collection shows the 2026 film, and no episode from the last 7 days is listed as still missing (or each one listed really is absent from Apple and TMDB).
- Owner turns off Tautulli notifier 1 (`/webhooks/tautulli-test`), and Tautulli's log shows no new "Webhook notification failed" lines after the next addition.

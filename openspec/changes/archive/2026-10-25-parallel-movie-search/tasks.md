# Tasks

Each code task is test-first: write the spec, run it and see it fail for the reason the task names, write the smallest code that passes, then run `bundle exec rspec`.

## 1. Branch

- [x] 1.1 Create the `parallel-movie-search` branch from an up-to-date `master` and verify `git branch --show-current` names it

## 2. Shared clients moved out of Show

- [x] 2.1 Move `Show.in_parallel` into `InParallel` and point `Show` at it; verify a new `spec/in_parallel_spec.rb` (results keep input order, a raising item becomes `nil`, at most `limit` run at once) passes and `show_search_spec.rb` passes unchanged
- [x] 2.2 Move `tmdb_request` into `Tmdb.get(path, params)` with every parameter escaped and the bearer token; verify a new `spec/tmdb_spec.rb` (a title with `&` and a space reaches TMDB as one `query` value, the `Authorization` header carries `TMDB_TOKEN`, the result is `{code:, body:}`) and every show spec pass unchanged
- [x] 2.3 Move the storefront list, query parameters, storefront search and `view` request into `AppleTv`, with the shared rank, de-duplicate and cap helper taking the item type and the cap (10 for shows, 20 for movies, each a constant next to its caller); verify a new `spec/apple_tv_spec.rb` (first storefront per id wins, exact before prefix before contains, the cap keeps the exact match, other item types ignored) passes and `show_search_spec.rb` passes unchanged
- [x] 2.4 Move `same_name?` and `same_year?` into `Match` and add `same_director?`; verify a new `spec/match_spec.rb` covers curly quotes, years one and two apart, a trailing non-breaking space, a blank director on either side, and "Kellerman" against "Urs"

## 3. TVDB and Heroku removed

- [x] 3.1 Delete `tvdb_auth`, `tvdb_call`, `tvdb_episodes`, `use_tvdb`, `heroku_call`, `get_tvdb_collection_id` and the `tvdb` branches in `get_episodes` and `plex_add`; first add a spec that opening a season with collection id `tvdb7611932` lists no episodes and makes no request to thetvdb.com, and verify `grep -rni 'tvdb\|heroku' app` finds nothing
- [x] 3.2 Delete `app/models/tvdb_migration.rb`, `bin/migrate-tvdb` and `spec/tvdb_migration_spec.rb`; verify `bundle exec rspec` passes and `grep -rn TvdbMigration .` finds nothing outside `openspec/`
- [x] 3.3 Remove `TVDB_APIKEY`, `TVDB_PIN`, `TVDB_USERNAME`, `TVDB_USERKEY`, `TVDB_TOKEN` and `HEROKU_KEY` from both compose files, `.env.example` and `spec/support/test_env.rb`; verify `docker compose config` succeeds for both files and the suite passes
- [x] 3.4 Reword the Heroku comment in `config/database.rb` to say why `DATABASE_URL` wins, without naming Heroku; verify the suite passes

## 4. Movie search

- [x] 4.1 Add `spec/support/movie_search_stubs.rb` with WebMock stand-ins shaped like the real Apple movie (`search/incremental` with `Movie` items, `view/product/<id>`) and TMDB movie (`search/movie`, `movie/<id>`) responses, with per-source delays as in the show stubs; verify a smoke spec using them runs with the network disabled
- [x] 4.2 Write `spec/movie_search_spec.rb` for every scenario in `specs/movie-search/spec.md` and run it; verify it fails on the current code for the expected reasons (duplicate Rocky, no "Rocky II" from Apple, repeated storefront fetches, `update_title_search` returning `nil`, timing)
- [x] 4.3 Build `MovieSearch` (Apple lookup on `AppleTv`, TMDB lookup on `Tmdb`, both in `InParallel`, merge on the calling thread with `Match`, sort by year then merge position) and trim Apple credits with a whitespace class that includes U+00A0; verify the merge, matching, Apple, TMDB, concurrency and credits scenarios pass
- [x] 4.4 Rewrite `Movie.get_titles` (database read on the calling thread, then `MovieSearch`) and `Movie.update_title_search` (no database rows, empty list when nothing is found) on it; verify the edit-form scenarios pass and `spec/views_spec.rb` and `spec/grid_responses_spec.rb` pass unchanged
- [x] 4.5 Add a `Movie.plex_add` spec where Apple returns "Rocky" (1976) next to "Rocky II" and verify only "Rocky" (1976) is saved and linked to the user
- [x] 4.6 Move `Movie.search_person` onto `Tmdb.get`; first add a spec that the person image URL comes back from a bearer-authenticated request, and verify `grep -rn TMDB_KEY app` finds nothing
- [x] 4.7 Remove `TMDB_KEY` from both compose files, `.env.example` and `spec/support/test_env.rb`; verify `docker compose config` succeeds and the suite passes

## 5. Unused code removed

- [x] 5.1 Delete the unused helpers in `Movie` (the old `appletv_call`, `get_itunes_info_by_title`, `get_itunes_info_by_year`, `itunes_info`, `itunes_studio`, `set_image`, `sanitize_input` and its commented-out callback, and `get_first_six` if nothing uses it) and in `Show` (`set_image` and anything else with no caller); verify each name is unused with `grep -rn` across `app`, `e2e`, `bin` and `spec` before deleting, and the suite passes

## 6. Integration checks

- [x] 6.1 Run `bundle exec rspec`, `npm run typecheck`, `npm test` and `npx playwright test`; verify all pass, including the e2e movie search and edit flows that replace `get_titles` and `update_title_search` in `e2e/seed.rb`
- [x] 6.2 With the app running locally against live Apple and TMDB, search `rocky` and `the office`; verify Rocky (1976) appears once, "Rocky II" comes from Apple, both searches return in under 2 seconds, and show results match `master`
- [x] 6.3 Run `/ponytail:ponytail-review` on the full diff and resolve its findings before the first commit

## Workflow follow-up

- Commit on the branch, archive the change in the same PR once the work is done, and open the PR with `gh`; the user merges it.
- Deploy with a `vYYYY.MM.DD.N` release tag, then run the Migration Plan's checks from design.md against production.

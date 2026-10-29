# Tasks

## 0. Branch

- [x] 0.1 Create `faster-show-search` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. One season list per show

- [x] 1.1 In `spec/show_search_spec.rb`, add a failing example: with three stored Apple seasons of one show and Apple's season list stubbed with new counts, `Show.get_series` makes exactly one season-list request for that show and every stored row has Apple's count. Run it and see it fail on three requests.
- [x] 1.2 Split `apple_season_window` into `apple_seasons` and `season_window`, make `refresh_apple_count` take a fetched list, and group the stored seasons by Apple show and store in `get_series`. Verify 1.1 passes and `spec/episode_lookup_spec.rb` and `spec/show_search_spec.rb` still pass.

## 2. Apple requests time out

- [x] 2.1 Add failing examples: every Apple request passes a 5-second timeout (checked on the `HTTParty.get` calls of a search and of an episode lookup); and with the season-list request timing out (WebMock `to_timeout`), the search returns the stored seasons with their stored counts. Run them and see the timeout example fail.
- [x] 2.2 Add `AppleTv::TIMEOUT = 5` and pass it to the four Apple calls. Verify 2.1 passes.

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `faster-show-search`, archive the change in the same PR and open it with `gh`. The owner merges and deploys.
- After deploying: time the South Park search on the server the same way as before (it was 1.9 to 2.0 s) and report the new numbers.

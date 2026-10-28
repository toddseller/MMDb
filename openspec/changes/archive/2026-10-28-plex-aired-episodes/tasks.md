# Tasks

## 0. Branch

- [x] 0.1 Create `plex-aired-episodes` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Show-level imports add only aired episodes

- [x] 1.1 Create `spec/plex_import_spec.rb` using `ShowSearchStubs`, with an Apple season stored the way `spec/episode_lookup_spec.rb` stores Lupin. Write failing examples for the spec's scenarios: a show-level `plex_add` (`'type' => 'show'`) whose fetched season has episodes dated before today, today, next week and undated saves only the first two kinds; a TMDB season with one aired and one upcoming episode saves only the aired one; a single-episode `plex_add` for an episode dated tomorrow saves it. Pin "today" with `travel_to` or by building dates from `Date.today`. Run `bundle exec rspec spec/plex_import_spec.rb` and see the show-level examples fail because the upcoming and undated episodes are saved, and the single-episode example pass.
- [x] 1.2 In the show-level branch of `Show.plex_add`, keep only fetched episodes whose `date` parses and is on or before `Date.today`, as in design.md. Verify that 1.1 passes.

## 2. Imports refresh stored episodes

- [x] 2.1 In `spec/plex_import_spec.rb`, write failing examples: a stored "Episode 6" with no plot gets the fetched title and plot from a single-episode import, and the season still has one episode 6; a stored "Episode 2" gets the fetched details from a show-level import; a hand-edited title is replaced by the source's title; a refreshed episode with a fetched runtime of 45 stores `"45 min"`. Also add an `Episode` example showing that saving an existing episode with runtime `"1h 5m"` leaves it unchanged. Run the file and see the refresh examples fail because the stored values are unchanged, and the `"1h 5m"` example pass.
- [x] 2.2 Replace the three `find_by(tv_episode:) || new` lines in `Show.plex_add` with `find_or_initialize_by` plus `assign_attributes`, and change `Episode`'s `before_create :create_duration` to the `before_save` condition in design.md. Verify that 2.1 and 1.1 pass.

## 3. Verify

- [x] 3.1 Run the whole RSpec, JS and Playwright suites and verify they all pass, especially `spec/episode_lookup_spec.rb` and `spec/plex_webhook_spec.rb`.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `plex-aired-episodes`, archive the change in the same PR and open it with `gh`; the owner merges.

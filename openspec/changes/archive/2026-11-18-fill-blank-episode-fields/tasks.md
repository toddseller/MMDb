# Tasks

## 1. Season helper

- [x] 1.1 Write failing specs for `Season#add_episode` covering a new episode, filling a blank plot and runtime (runtime saved as `42 min`, including a runtime stored as `0 min`), keeping stored and hand-edited values, ignoring a blank incoming value, and no duplicate for the same episode number; run them and confirm they fail because the method is missing
- [x] 1.2 Add `Season#add_episode(attrs)` to `app/models/season.rb` and verify the 1.1 specs pass

## 2. Call sites

- [x] 2.1 Add a failing request spec: re-adding a stored episode with a blank plot through the search panel's episodes route (one episode and the `episodes` array) fills the plot and keeps a stored title; confirm it fails, switch `app/controllers/users_episodes.rb` to `add_episode`, and verify it passes
- [x] 2.2 Add a failing request spec for Create New Show's episode add on an existing episode number; confirm it fails, switch `app/controllers/shows_controller.rb` to `add_episode` (keeping `@episode` and the count), and verify it passes
- [x] 2.3 Add failing request specs for `POST /add_episodes` in API v2 and v3 (single and array) re-adding an episode without a runtime; confirm they fail, switch both controllers to `add_episode`, and verify the response lists the episode once with the runtime
- [x] 2.4 Verify no `find_by(tv_episode:` `|| ... .new` or `season.episodes <<` remains in `app/controllers` (`grep`), and the full suite passes (`bundle exec rspec`)

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, commit the code, then archive the change in the same PR as a second commit.

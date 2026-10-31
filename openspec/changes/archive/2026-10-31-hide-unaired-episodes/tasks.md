# Tasks

## 1. Hide unaired episodes

- [x] 1.1 In `spec/episode_lookup_spec.rb`, add a test that stubs an Apple season whose episodes 1 and 2 aired before today, 3 airs today, 4 airs next week and 5 has no release date, and expects `Show.get_episodes` to list episodes 1, 2 and 3; run it and show it failing because 4 and 5 are listed
- [x] 1.2 Add a test that stubs a TMDB season (`tmdb` collection id) with one episode aired yesterday and one airing next week, and expects only the first to be listed; run it and show it failing because both are listed
- [x] 1.3 In `Show.get_episodes`, keep only episodes for which `Show.aired?(episode[:date])` is true, and verify both new tests and the rest of `spec/episode_lookup_spec.rb` and `spec/plex_import_spec.rb` pass

## 2. Integration

- [x] 2.1 Run the whole suite (`bundle exec rspec` and `npm test`) and verify it is green
- [x] 2.2 Run `openspec validate hide-unaired-episodes --strict` and verify it passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff and wait for the user to pick fixes before the first commit.
- Archive the change in the same PR, then open the PR with `gh`.

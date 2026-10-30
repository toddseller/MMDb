# Tasks

## 1. Movie order

- [x] 1.1 In `spec/movie_spec.rb`, add a test that creates two movies with the same title and year for one user, updates the first, and expects `user.movies.sorted_list` to return the first one first; run it and show it failing on order, then add `:id` to `Movie.sorted_list` and verify it passes
- [x] 1.2 Add a test that two movies with the same `user_count` come back from `Movie.top_movies` oldest first (same update trick); show it failing, then add `id: :asc` to `top_movies` and verify it passes
- [x] 1.3 Add a test that two movies with the same `created_at` come back from `Movie.recently_added` newest id first; show it failing, then add `id: :desc` to `recently_added` and verify it passes
- [x] 1.4 Add a test that `Movie.basic_info` keeps two same-title movies in year order (earlier year first, inserted later year first); show it failing or explain why the unstable `sort_by` happens to pass, then delete the `sort_by` and verify it passes

## 2. Show order

- [x] 2.1 In `spec/show_spec.rb`, add the same tied-rows test for `user.shows.sorted_list`; show it failing, then add `:id` to `Show.sorted_list` and verify it passes
- [x] 2.2 Add the same-`created_at` test for `Show.recently_added`; show it failing, then add `id: :desc` and verify it passes

## 3. Integration

- [x] 3.1 Run the whole suite (`bundle exec rspec` and the JS tests) and verify it is green
- [x] 3.2 Run `openspec validate stable-order --strict` and verify it passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff and wait for the user to pick fixes before the first commit.
- Archive the change in the same PR, then open the PR with `gh`.

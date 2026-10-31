# Tasks

## 1. TMDB timeout

- [x] 1.1 In `spec/tmdb_spec.rb`, add a test that wraps `Net::HTTP.start` and expects every `Tmdb.get` to pass `open_timeout: 5` and `read_timeout: 5`; run it and show it failing because no timeout is passed, then pass `AppleTv::TIMEOUT` for both in `Tmdb.get` and verify it passes
- [x] 1.2 In `spec/movie_search_spec.rb`, add the two TMDB scenarios from the movie-search delta (search request `to_timeout`, then one details request `to_timeout`) and verify they pass; they cover existing failure handling, so explain rather than force a failure if they pass before 1.1
- [x] 1.3 In `spec/show_search_spec.rb`, add the two TMDB scenarios from the show-search delta the same way and verify they pass

## 2. Tautulli timeout

- [x] 2.1 Add `spec/library_counts_spec.rb` with a test that stubs Tautulli's `get_libraries` answer and expects `/api/movies/count` to return the movies, shows and episodes counts; verify it passes (it describes current behavior)
- [x] 2.2 Add a test that records the options `HTTParty.get` receives for the Tautulli URL and expects `timeout: 5`; show it failing because no timeout is passed, then add `timeout: AppleTv::TIMEOUT` to `Movie.plex_count` and verify it passes
- [x] 2.3 Add a test that stubs the Tautulli request `to_timeout` and expects the request to `/api/movies/count` to raise the timeout error (production turns it into a 500); verify it passes

## 3. Integration

- [x] 3.1 Run the whole suite (`bundle exec rspec` and the JS tests) and verify it is green
- [x] 3.2 Run `openspec validate add-tmdb-tautulli-timeouts --strict` and verify it passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff and wait for the user to pick fixes before the first commit.
- Archive the change in the same PR, then open the PR with `gh`.

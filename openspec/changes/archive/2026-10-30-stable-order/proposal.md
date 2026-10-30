# Proposal

## Why

Every movie and show list is ordered by columns that can tie (`sort_name` and `year`, `user_count`, `created_at`), and Postgres returns tied rows in any order it likes. So the same request can come back in a different order, and a paginated list (the movies page, the iOS pages) can repeat or skip a title at a page boundary. Nobody has reported a symptom yet; this fixes it before someone does.

## What Changes

- Movie and show collection lists (`sorted_list`) break ties by record id, so titles that share a sort name and year always come back in the same order.
- The top movies list (`top_movies`) breaks ties in `user_count` by record id, so the home page and the API top 10 stop changing between loads.
- The recently added lists (`recently_added`, movies and shows) break ties in `created_at` by newest id first.
- `Movie.basic_info` stops re-sorting the database result in Ruby. That unstable `sort_by` on `sort_name` alone could undo the year order.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `movie-collection`: adds a requirement that every movie list returns the same order on every request.
- `show-collection`: adds a requirement that every show list returns the same order on every request.

## Impact

- Code: the `sorted_list`, `top_movies` and `recently_added` scopes in `app/models/movie.rb` and `app/models/show.rb`, and `Movie.basic_info`.
- Callers pick the fix up unchanged: the users, movies and shows controllers, the API v1, v2 and v3 controllers, and the home page view.
- APIs: same fields, same primary order. Only the order of tied rows becomes fixed.
- No migration, no new dependency.

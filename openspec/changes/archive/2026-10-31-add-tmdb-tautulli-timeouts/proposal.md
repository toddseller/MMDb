# Proposal

## Why

Production runs Puma with one process and one thread (`WEB_CONCURRENCY=0`, `PUMA_THREADS=1` in the server's `.env`), so every request waits for the one ahead of it. Apple requests already give up after 5 seconds, but TMDB requests (`Tmdb.get`) and the Tautulli library count (`Movie.plex_count`) set no timeout, so Net::HTTP waits its default 60 seconds to connect and 60 more to read. One stalled TMDB or Tautulli answer can freeze the whole site for a minute or more. The production access log from 2026-10-30 and 31 shows every route finishing in under 0.9 seconds, so a 5-second limit only cuts off answers that have already stalled.

## What Changes

- Every TMDB request gives up after 5 seconds, the same limit Apple requests use. A request that gives up fails the way an unreachable TMDB already does, so each caller keeps its current failure handling: searches drop the TMDB entries and keep the database and Apple ones.
- The Tautulli library-count request behind `/api/movies/count` gives up after 5 seconds. When it does, the endpoint answers with a server error, as it does today when Tautulli is unreachable, but within about 5 seconds rather than up to 2 minutes.
- No change to Puma's thread or worker settings; those are server configuration and are outside this change.

## Capabilities

### New Capabilities
- `library-counts`: the `/api/movies/count` endpoint that reports Plex library counts from Tautulli, and how it behaves when Tautulli is slow.

### Modified Capabilities
- `movie-search`: adds a requirement that a slow TMDB answer doesn't hold up a movie search.
- `show-search`: adds a requirement that a slow TMDB answer doesn't hold up a show search, next to the existing Apple timeout requirement.

## Impact

- Code: `app/models/tmdb.rb` (`Tmdb.get`) and `app/models/movie.rb` (`Movie.plex_count`).
- Callers that inherit the TMDB limit without changes: movie and show searches, the movie search's person photo (`/movies/search`), TMDB episode lists (`Show.get_episodes`), and the Plex webhook's TMDB episode import.
- Tests: `spec/tmdb_spec.rb`, plus the movie and show search specs and a new spec for the library count.
- No new dependencies, settings or API changes.

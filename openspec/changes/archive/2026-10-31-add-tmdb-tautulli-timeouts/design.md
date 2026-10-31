# Design

## Context

Apple requests already pass `timeout: AppleTv::TIMEOUT` (5) to HTTParty, and a test (`spec/show_search_spec.rb`, "gives every Apple request a 5-second timeout") records the option on every Apple call. TMDB goes through one helper, `Tmdb.get`, which uses `Net::HTTP.start` with no timeout options. Tautulli is one `HTTParty.get` in `Movie.plex_count`, also with no timeout. Net::HTTP's defaults are 60 seconds to open and 60 to read.

When a request times out, Net::HTTP raises `Net::OpenTimeout` or `Net::ReadTimeout`, which are `StandardError`s, the same kind of error an unreachable host raises today. The search callers already turn such an error into a missing result: `InParallel.map` rescues and logs per item, and both searches treat a `nil` source as empty.

## Goals / Non-Goals

**Goals:**
- Bound every TMDB and Tautulli request at 5 seconds, set in the two places those requests are made.

**Non-Goals:**
- New failure handling in callers. The callers that don't rescue today (the person photo on `/movies/search`, TMDB episode lists, the webhook's TMDB import, `/api/movies/count`) keep failing the way they do when the host is down; they just fail sooner.
- Retries, or a shared HTTP client for Apple, TMDB and Tautulli.

## Decisions

- **Reuse `AppleTv::TIMEOUT` rather than adding constants.** All three outside services get the same 5-second limit, and the existing constant's comment already explains the number. `Tmdb.get` passes `open_timeout:` and `read_timeout:` to `Net::HTTP.start`; `plex_count` passes `timeout:` to `HTTParty.get`, as the Apple calls do. Alternative: a `Tmdb::TIMEOUT`. It would be the same number with a second place to change it, so not now.
- **Set the limit inside `Tmdb.get`, not at each caller.** Every TMDB request goes through it, so one change covers search, episode lists and the webhook.
- **Tests stub timeouts with WebMock's `to_timeout`**, as the Apple test does, and check that each request carries the 5-second option. In the test environment Sinatra re-raises errors, so the library-count test expects the timeout error to reach the caller rather than a 500 status; production turns the same error into a 500.

## Risks / Trade-offs

- [A slow but healthy TMDB answer over 5 seconds now fails] → The production log tops out at 0.82 seconds per request, and Apple has used the same limit without trouble.
- [A TMDB timeout in the webhook's episode import drops that import] → It fails today when TMDB is down, and Plex sends a new event for the next addition; this change doesn't make it worse.
- [`/api/movies/count` still answers 500 when Tautulli is down] → Unchanged behavior; toddseller.com already gets it when Tautulli is unreachable.

## Migration Plan

A normal tag deploy. No settings or data change; rolling back is the previous tag.

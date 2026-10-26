# Proposal

## Why

4,201 of the 4,594 movies have their rating stored as their producer, so the details view shows, for example, Hook's producer as "PG". Read-only checks on 2026-10-25 found that only `producer` is affected, and that no affected row was created or updated after 2024-02-26: movies added since then have real producers. This is a one-off repair of old data, not a fix to current code.

## What Changes

- A one-off script repairs every movie whose producer equals its non-blank rating, in two steps:
  - a dry run that looks each movie up and writes a CSV report, changing nothing;
  - an apply step that writes exactly what the reviewed report says.
- Producers come from the same source as the movie's poster: Apple for `mzstatic.com` posters, TMDB for TMDB posters, and TMDB then Apple for the 12 movies with other artwork. That keeps each movie's credits consistent with the rest of its record.
- Matching runs from most to least certain:
  1. the exact artwork in the poster's source;
  2. title, year and director in that source;
  3. title, year and director in the other source.
- Apple lookups search the US store first. The UK, Canada and Australia stores are tried in turn only when the US request fails or returns no matching movie.
- A movie matched on Apple by title, year and director (so its stored cover is one Apple no longer uses) also gets Apple's current cover. The old covers still load; this brings about 1,300 covers up to date. No other movie's poster changes.
- Beside the CSV, the dry run writes an HTML page showing each changed cover, old beside new, so about 1,300 cover changes can be reviewed by eye.
- Movies no step can match get an empty producer, which the details view hides; the rating copy carries no information. A lookup that failed (a network or server error) is reported, not cleared.
- When Apple rate-limits the run (`429`), it waits five minutes and tries once more, and if the limit is still there it stops with a usable partial report; the next dry run takes up the movies still affected. (Added after the first server run hit Apple's limit.)
- The apply step only writes rows whose producer still equals both their rating and the reported old value, and whose poster still equals the reported old poster, so a movie fixed by hand in the meantime is left alone. It makes no network requests.

A sample of 24 affected movies matched all 24: 16 by exact artwork and 8 by title, year and director. 15 of the 16 Apple movies were found in the US store alone.

## Capabilities

### New Capabilities
- `producer-repair`: the one-off repair of producers that hold a movie's rating: which movies it covers, where the producers come from, how movies are matched, when Apple's current cover replaces the stored one, and the reviewed dry-run and apply steps with their review page.

### Modified Capabilities

None. How the app finds, shows and edits movies is unchanged; the app's own movie search keeps searching all four Apple stores at once.

## Impact

- New `app/models/producer_repair.rb` and `bin/repair-producers`, reusing `Tmdb.get`, `AppleTv.view`, `AppleTv`'s URL constants, `Movie.get_producers`, `Movie.get_director`, `Movie.get_first_six` and `Match`.
- New `spec/producer_repair_spec.rb` with WebMock stubs.
- Data: up to 4,201 rows of `movies.producer` and about 1,300 of `movies.poster` in production, after a `pg_dump` backup of the `movies` table. The dry run makes roughly 7,000 to 9,000 requests to Apple and TMDB and takes about an hour.
- No schema, view, API or dependency changes.

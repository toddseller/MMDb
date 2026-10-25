# Design

## Context

These counts come from read-only queries and lookups on 2026-10-25:
- 4,201 movies have `producer = rating` with a non-blank rating. No other credit field holds a copied rating. The newest affected row was last updated on 2024-02-26.
- Poster hosts: 3,426 on `is1` to `is5-ssl.mzstatic.com` (Apple; 758 old iTunes-style paths, 2,668 newer `/v4/` paths), 763 on TMDB hosts, 12 elsewhere (`cdn.myflix.stream`, S3, gstatic).
- 4 affected movies have no director and 1 has no four-digit year.
- In a 24-movie sample, exact artwork found 16 (4 of 8 old Apple, 5 of 8 new Apple, 7 of 8 TMDB) and title, year and director found the other 8. 15 of the 16 Apple movies were found in the US store, usually on its first result.
- The two sources list different producers for the same film (Bruce Almighty: Apple has Tom Shadyac, Mark O'Keefe, Jim Carrey; TMDB has Michael Bostick, James D. Brubaker, Jim Carrey).

There is no TMDB or Apple id column on `movies`, so a movie can only be found again from its title, year, director and poster.

The existing source helpers hide failures: `MovieSearch.apple_movie` and `MovieSearch.tmdb_movie` return nil for any non-200 answer, and `AppleTv.search` returns `[]`. That suits the search box, but the repair has to tell "not found" (clear the producer) apart from "failed" (leave it).

## Goals / Non-Goals

**Goals:**
- Implement `specs/producer-repair/spec.md`. What gets written is decided by a report a person has read.

**Non-Goals:**
- Finding what wrote the ratings into `producer`. It stopped in early 2024 and no code in this repo does it.
- Repairing other fields, apart from the poster of a movie Apple matches by title, year and director, or movies whose producer is wrong in other ways.
- Refreshing artwork for movies this repair doesn't cover.
- Changing how the app's search looks movies up (it keeps searching all four Apple stores at once).
- Keeping the tool after it has run; like the TVDB migration, it can be removed in a later change.

## Decisions

**Logic in `ProducerRepair`, with `bin/repair-producers` as a thin entry point.** This follows the TVDB migration (`2026-10-24-migrate-tvdb-ids`). `app/models/producer_repair.rb` holds:
- `ProducerRepair.plan` (returns report rows);
- `ProducerRepair.apply(rows)` (returns written and skipped rows).

The `bin` script handles arguments, the CSV file and progress output:
- `bin/repair-producers plan <file.csv>`
- `bin/repair-producers apply <file.csv>`

That lets the specs call the class directly with WebMock. The explore session agreed a rake task as the default; `bin/` matches the earlier one-off migration and `bin/deploy`, and needs no Rakefile changes.

**The report is CSV, not JSON as the TVDB plan was**, because the owner reviews it and may edit or delete rows, which suits a spreadsheet. Its columns are `id`, `title`, `year`, `source` (`apple`, `tmdb` or `other`), `matched_by`, `old_producer`, `new_producer`, `old_poster` and `new_poster`. Ruby's `csv` standard library writes and reads it. `old_producer` and `old_poster` double as the apply step's stale check.

**An Apple match by title, year and director also brings Apple's current cover.** Those are the movies whose stored cover Apple no longer uses (about 7 in 16 Apple movies in the sample, so roughly 1,300). The old covers still load, so this updates the artwork rather than fixing broken images. The new URL is built as `MovieSearch.apple_movie` builds it: the cover's `{w}x{h}.{f}` replaced with its own width and height and `.jpg`. Every other movie gets a blank `new_poster`: an artwork match is already the same image, and a TMDB match has no Apple cover to offer. The product view is already fetched for the match, so the poster costs no extra requests.

**A review page beside the CSV.** The dry run also writes `<file>.html`, a static page with one row per movie with a new poster: id, title and year, then the old and new covers as `<img>` tags (the grid-sized thumbnails, via the same `348x522bb` rewrite as `Movie#thumbnail`, so about 1,300 rows load quickly). It is plain HTML with inline styles and no scripts, written with ERB from the standard library and every value escaped. The CSV stays the source of truth: to keep a cover, the reviewer blanks its `new_poster` or deletes its row.

**Requests are made here, with every answer checked.** A lookup raises `ProducerRepair::Failed` on a non-200 answer, a timeout or a connection error, and the movie's row becomes `failed`. Parsing reuses what the app already does:
- TMDB: `Tmdb.get` for the requests; `Movie.get_producers` and `Movie.get_director` on `movie/<id>?append_to_response=credits` for the credits.
- Apple: the search URL built from `AppleTv::BASE` and `AppleTv::PARAMS` as `AppleTv.search` builds it, and `AppleTv.view('product/<id>', store)` for each candidate. Producers come from `roles` of type `Producer`, trimmed of edge spaces as `MovieSearch.apple_movie` does, and joined with `Movie.get_first_six`.
- Matching: `Match.same_name?`, `Match.same_year?` and `Match.same_director?`, which `MovieSearch.same_movie?` combines.

**Matching per source.**
- *Apple:* for each store in order (US first), search the title and take up to 10 results of type `Movie`. For each, fetch its product view and stop at the first whose cover path equals the poster's (`artwork`) or whose title, year and director match (`title_year_director`). Move to the next store only when this store failed or found nothing.
- *TMDB:*
  1. Search the title and check the results' `poster_path` against the poster's file name.
  2. If none matches, look among results with the same title and a year at most one apart. Fetch each one's `movie/<id>/images` and match if the poster is among its posters (`artwork`).
  3. Otherwise fetch credits and match on the director.
- The other source is tried only when the first found nothing (`other_source`); a failure in the first source marks the row `failed` without trying the other.
- A movie with no director can still match by artwork. By title and year it matches only as `Match.same_director?` already allows: a blank director on either side matches.

**One movie at a time, with a pause.** The dry run handles movies one after another, with 0.2 seconds between Apple requests. Apple publishes no limits for this API, so the run stays gentle; at about 2 to 3 requests per movie it takes around an hour. The script prints progress every 100 movies and flushes the CSV as it goes, so an interrupted run still leaves a usable partial report.

**Apply in one transaction with `update_columns`.** It writes only `producer`, and `poster` when `new_poster` isn't blank, and skips the callbacks, which would recompute fields this repair doesn't own and touch `updated_at`. (`adjust_url` only upgrades old `http:` Apple links, and Apple's covers are already `https`.) For each row it loads the movie and writes only if `producer == rating`, `producer == old_producer` and `poster == old_poster`. Otherwise the row is skipped and listed. Rows marked `failed` are skipped. Unlike the TVDB migration, a stale row skips just that row rather than stopping the whole apply: with 4,201 rows and a long review, an edit by hand in between is likely and shouldn't block the rest.

## Risks / Trade-offs

- [A title, year and director match picks a different film with the same name, year and director] → Unlikely, and visible in the report as `title_year_director` for review.
- [Apple answers empty in the US store for a movie it does carry (it has been flaky before)] → The other stores, then TMDB, are tried. A wrong source is visible in the report as `other_source`.
- [Apple throttles the run] → Throttling shows up as errors, so those movies are `failed` and left unchanged. Rerunning the dry run later covers only the movies still affected.
- [A reviewed CSV is saved by a spreadsheet with changed encoding or quoting] → `apply` reads it with Ruby's CSV, and the stale check on `old_producer` skips any row whose old value no longer matches.
- [A cover the owner chose on purpose is replaced by Apple's current one] → Every cover change is on the review page, and blanking `new_poster` keeps the old one.
- [Bad apply] → Restore `movies` from the `pg_dump`. Every old producer also equals the movie's rating, so `UPDATE movies SET producer = rating WHERE id IN (...)` undoes producers; the report's `old_poster` column restores covers.

## Migration Plan

1. Merge and deploy as usual.
2. On the server: `docker compose exec -T web bin/repair-producers plan tmp/producers.csv` (about an hour). Copy `tmp/producers.csv` and `tmp/producers.csv.html` locally for the owner to review: covers on the page, producers and edits in the CSV.
3. Copy the reviewed CSV back to `tmp/producers.csv` in the container.
4. Back up: `docker run --rm postgres:11 pg_dump -t movies "$DATABASE_URL" > ~/mmdb-movies-<date>.sql`.
5. Apply: `docker compose exec -T web bin/repair-producers apply tmp/producers.csv`, and keep its list of skipped rows.
6. Run the dry run again; it should list only the movies that were skipped or failed.
7. Spot-check Hook, Bruce Almighty (new producers and cover) and Metropia on mmdb.online.

Rollback: restore `movies` from the dump.

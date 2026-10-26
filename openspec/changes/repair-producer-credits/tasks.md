# Tasks

Groups 1 to 3 work test-first in `spec/producer_repair_spec.rb`: write the examples named in the task, run them and see them fail for the reason given, write the smallest code that passes, then run the whole suite (`bundle exec rspec`, `npm test`, `npm run typecheck`, `npx playwright test`). The specs stub every request with WebMock, as `spec/show_search_spec.rb` does.

## 1. Which movies, and from which source

- [x] 1.1 Add examples: `ProducerRepair.plan` covers a movie whose producer equals its rating (`PG`/`PG`) and leaves out one with real producers, one with a different rating and one whose rating and producer are both blank. Verify they fail because `ProducerRepair` doesn't exist, then add the class with the selection query and verify they pass.
- [x] 1.2 Add examples: the first source is Apple for an `is3-ssl.mzstatic.com` poster, TMDB for `image.tmdb.org` and `www.themoviedb.org` posters, and TMDB for a `cdn.myflix.stream` poster; each report row's `source` says so (`apple`, `tmdb`, `other`). Verify they fail, add the routing, and verify they pass.

## 2. Matching

- [x] 2.1 Add TMDB examples:
  - the search result with the poster's file name matches as `artwork` and gives its producers;
  - a poster found only in a same-year result's `movie/<id>/images` matches as `artwork`;
  - with no poster match, the same title, a year one apart and the same director match as `title_year_director`;
  - eight producers become the first six joined by `, `;
  - a match with no producers gives an empty new producer.

  Verify they fail, add the TMDB lookup using `Tmdb.get`, `Movie.get_producers`, `Movie.get_director` and `Match`, and verify they pass.
- [x] 2.2 Add Apple examples:
  - a US result whose cover has the poster's path on another `isN` host and size matches as `artwork`, and no other store is requested;
  - a US result with the same title, year and director matches as `title_year_director`;
  - a US search with no matching movie moves on to the UK store, and a UK match means Canada and Australia are never requested;
  - producers come from `roles` of type `Producer`, trimmed of edge spaces;
  - a `title_year_director` match gets Apple's cover URL with its own width and height as the new poster, and an `artwork` match gets no new poster.

  Verify they fail, add the Apple lookup with the US-first store order and the 0.2-second pause (stubbed out in the specs), and verify they pass.
- [x] 2.3 Add examples:
  - an Apple-poster movie no Apple store has, but TMDB matches by title, year and director, is `other_source`;
  - an `other_source`, `unmatched` or `failed` row gets no new poster;
  - a movie neither source matches is `unmatched` with an empty new producer;
  - a 503, a timeout or a connection error in the first source makes the row `failed` with no new producer, and the other source is not tried.

  Verify they fail, add the fallback and the failure handling (`ProducerRepair::Failed`), and verify they pass.

## 3. Report and apply

- [x] 3.1 Add examples: `bin/repair-producers plan <file>` writes a CSV with the header `id,title,year,source,matched_by,old_producer,new_producer,old_poster,new_poster` and one row per covered movie, and leaves every movie's producer and poster unchanged. Verify they fail, add the script (thin, calling `ProducerRepair.plan`, writing rows as they come, printing progress every 100 movies), and verify they pass.
- [x] 3.2 Add examples: the plan step also writes `<file>.html` with one row per movie with a new poster, showing its id, title and year and its old and new covers as grid-sized `<img>` thumbnails, no row for a movie without a new poster, no `<script>`, and a title or URL holding `<script>` or a quote escaped. Verify they fail, add the page (ERB from the standard library), and verify they pass. Open it on a sample in a browser and show a screenshot to the owner.
- [x] 3.3 Add examples for `ProducerRepair.apply`:
  - every row is written in one transaction, and only `producer`, and `poster` where `new_poster` isn't blank, change (`updated_at` included);
  - a blanked `new_poster` writes the producer and leaves the poster;
  - a movie whose poster changed after the dry run is skipped and listed;
  - an edited `new_producer` is written as edited, and a deleted row is not written;
  - a movie whose producer changed after the dry run is skipped and listed;
  - a `failed` row is skipped;
  - it works with all network requests blocked (`WebMock.disable_net_connect!` and no stubs).

  Verify they fail, add `apply` and `bin/repair-producers apply <file>` (which prints written and skipped counts and the skipped ids), and verify they pass.
- [x] 3.4 Run the whole suite and verify it passes.

## 4. Run it

- [x] 4.1 Run the dry run locally against 20 affected movies read from production (chosen through `write_plan`'s `movies:` option, in a read-only database session) and verify the report against the sample results from the explore session: Bruce Almighty `title_year_director` on Apple with a new poster, Metropia `other_source`, Layer Cake `artwork`; and the review page shows Bruce Almighty's old and new covers.
- [x] 4.2 After merge and deploy, run the full dry run on the server and copy the CSV and its HTML page to the owner. (The first run, on 2026-10-26, was stopped at 2,139 movies when Apple rate-limited it; its partial report is what the owner reviews.) Verify by the owner's review: they approve the report and the covers, edited as they see fit. (Approved unedited on 2026-10-26.)
- [x] 4.3 Back up `movies` with `pg_dump`, apply the reviewed report, and verify the printed written, failed and changed counts add up to the report's rows. Check Hook, Bruce Almighty (producers and cover) and Metropia on mmdb.online. (Applied 2026-10-26 after a `pg_dump` to `~/mmdb-movies-2026-10-26.sql`: 1,385 written, 754 failed, 0 changed, which is all 2,139 rows; 2,816 movies remain affected. Hook and Bruce Almighty checked live; Metropia was beyond the stopped run, so its check moves to 6.2.)

## 5. Waiting out Apple's rate limit

Test-first in `spec/producer_repair_spec.rb`, on the local branch `retry-apple-rate-limit`, which is committed but not pushed until the final PR.

- [x] 5.1 Add examples: an Apple search or product request answered 429 and then 200 is repeated once after a five-minute wait and the movie matches normally (`sleep` stubbed, waits recorded). Verify they fail, add the wait and repeat to `apple_get`, and verify they pass.
- [x] 5.2 Add examples: a request answered 429 again after the wait raises `ProducerRepair::Limited`, which `write_plan` turns into a stop that keeps the rows so far, writes the cover page for them, leaves out the movie being looked up, and logs `Apple's rate limit stopped the run after <n> movies`. Verify they fail, add it, and verify they pass.
- [x] 5.3 Add examples: a failed movie is logged straight away as `Failed <id> <title>: <reason>`, and the reason is not a CSV column. Verify they fail, add it, set `$stdout.sync = true` in `bin/repair-producers`, raise `APPLE_PAUSE` to 1 second, and verify they pass. Run the whole suite and verify it passes.
- [x] 5.4 Run the ponytail review on the branch's diff, commit on the local branch, and copy `app/models/producer_repair.rb` to the server as `~/MMDb/tmp/producer_repair.rb`. Verify `git status --porcelain --untracked-files=no` on the server prints nothing.

## 6. Second pass

- [ ] 6.1 After 4.3, run the dry run on the server with the patched module (see design.md) into `tmp/producers-2.csv`, and copy it and its cover page to the owner. Verify it covers only movies still affected, its log names any failures with reasons, and the owner approves it.
- [ ] 6.2 Back up `movies` again, apply the reviewed second report, and verify the counts, and check Metropia and Mask on mmdb.online. Repeat 6.1 and 6.2 for any movies still failing or not reached until a run reports no failures, or the owner decides to leave the rest.

## Workflow follow-up

- Work on a feature branch from master, run the ponytail review on the diff before the first commit, and archive the change in the same PR.
- Once the repair is done, one PR archives this change and removes `ProducerRepair`, `bin/repair-producers`, their spec and the `.gitignore` exception. It carries the `retry-apple-rate-limit` branch's commits, so the history keeps the code that ran. Delete `~/MMDb/tmp/producer_repair.rb` and the reports from the server.

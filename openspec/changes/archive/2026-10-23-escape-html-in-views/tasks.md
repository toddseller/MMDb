# Tasks

Test-first throughout: write the test, run it and see it fail for the right reason, then write the smallest code that passes, then run the whole suite. Work on the branch `escape-html-in-views`.

## 1. Branch

- [x] 1.1 Create the branch `escape-html-in-views` from `master`; verify `git status -sb` shows it

## 2. What pages look like today (spec: Stored entities display as characters)

- [x] 2.1 Write `spec/page_text_spec.rb` rendering the shows page, a user's movies page, movie info and show info (XHR), the movie edit form, and the shows grid after adding episodes, for data with a title `Law & Order`, a plot stored as `Tom &amp; Jerry`, and a poster URL; assert each page's visible text and the edit form's input values. Verify it passes now, describing current output (design decision 6)
  - Note: the recorded movie info snapshot has `img[alt]=Law`: the unquoted `alt` cuts the title at its first space today. Quoting in 5.2 fixes that, so that snapshot line is expected to change there and only there.

## 3. Hostile input (specs: Stored text never becomes markup; Text in attributes can't add attributes)

- [x] 3.1 Write `spec/page_escaping_spec.rb` on the same pages: a title `<script>window.__xss = true</script>` adds no `script` element; a plot with `<img src=x onerror=alert(1)>` adds no `img`; a movie titled `x onerror=alert(1)` leaves its poster `img` without `onerror` and with the title in `alt`; a poster URL containing `"` plus an attribute adds no attribute; the XHR shows grid is escaped too. Run it and see these fail

## 4. Escaping by default (design decisions 1 to 3)

- [x] 4.1 Write `spec/view_text_spec.rb` for `ViewText.escape`: stored `Tom &amp; Jerry` comes out as `Tom &amp; Jerry`, not double-escaped as `Tom &amp;amp; Jerry`, so it displays `&`; `<b>` becomes `&lt;b&gt;`, `"` becomes `&quot;`, numbers and `nil` become strings; run it and see it fail with `NameError`
- [x] 4.2 Add `app/helpers/view_text.rb`, add `erubi` to the Gemfile, set `:erb` to `escape: true, escapefunc: '::ViewText.escape'` in `config.ru`, and confirm `Tilt[:erb]` is `Tilt::ErubiTemplate` (replace `require 'tilt/erb'` with `require 'tilt/erubi'` if it isn't); verify 4.1 passes and `Gemfile.lock` still lists `x86_64-linux`
- [x] 4.3 Change the layout's `yield` and the 16 partial calls to `<%== %>`; verify 2.1 passes unchanged, the script and plot examples of 3.1 pass, and the whole suite passes except the attribute examples

## 5. Quoted attributes (spec: Raw HTML is limited to the layout and partials; design decisions 4 and 5)

- [x] 5.1 Write `spec/views_spec.rb`: no output in `app/views` follows `=` without a quote, and every `<%==` holds only `yield` or an `erb :'/partials/...'` call, with failures naming file and line; run it and see it fail listing the 87 unquoted outputs
- [x] 5.2 Double-quote the 87 attribute outputs; verify 5.1, all of 3.1, 2.1 unchanged, and the whole suite pass
  - Note: two snapshots changed, both from the attribute fix: movie info `img[alt]` went from `Law` to the full title, and show info had `img[src]=alt=Law` (an empty unquoted `src` swallowed the next attribute), now an empty `src` and the full `alt`. Both were re-recorded; the other four were unchanged.

## 6. Pull request with its archive

- [x] 6.1 Commit, push the branch, and have the owner open the pull request; verify the `test` check passes
- [x] 6.2 Archive the change on the branch as its last commit (sync `web-page-escaping` into a new main spec, move the change to `openspec/changes/archive/`), push, and verify the `test` check passes on that commit

## Workflow follow-up

These run after the owner merges the pull request:

- Deploy: `cd ~/MMDb && git pull --ff-only && docker compose up -d --build` (the gems change).
- In Brave, check that the shows page, a movies page, a movie's info view and a show's info view look as before, including titles with `&` and plots that contained `&amp;`.

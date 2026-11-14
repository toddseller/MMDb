## 1. Failing tests

- [x] 1.1 Add an e2e test in `e2e/adding.spec.js` (shows page) that searches, clicks `#dismiss`, and expects the panel hidden and Add TV Show back; repeat after picking a season. Run it and see the click fail because `#letter-rail` intercepts it.
- [x] 1.2 Change the unit test "a show search uses the shows layout" in `spec/js/preview.test.js` so it no longer pins the dismiss position to the shows layout, and drop the movies test's `style.top` assertion that the stylesheet now owns.

## 2. Fix

- [x] 2.1 Set `#dismiss` to `top: 0` in `public/css/movies.css`.
- [x] 2.2 Remove the `dismiss` layout style from `LAYOUT`, its typedef, and the `dismiss.style.cssText` line in `applyLayout` (`public/js/mmdb/preview.js`).

## 3. Same place on both pages

- [x] 3.1 Assert in the movies and shows e2e dismiss tests that the X's top equals the search box's top; see the movies one fail (139 against 71).
- [x] 3.2 Move `#dismiss` out of `.preview-wrapper` to the band in `users/show.erb`, `movies/show.erb` and `shows/show.erb`, and give `#search-wrapper` `position: relative`.

## 4. Verify

- [x] 4.1 Run the unit suite, the e2e suite and RSpec; all pass.
- [x] 4.2 Screenshot the shows page with results open and the movies page, and get approval before committing.

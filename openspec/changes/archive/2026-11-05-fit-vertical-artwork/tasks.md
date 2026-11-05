# Tasks

## 1. Branch

- [x] 1.1 Fetch `origin` and create the `fit-vertical-artwork` branch from the fresh `origin/master`, carrying this change's untracked `openspec/changes/fit-vertical-artwork/` across; verify with `git status` that the branch is on `origin/master` and holds only those files

## 2. Fit the artwork preview

- [x] 2.1 In `e2e/artwork.spec.js`, add a test that routes a poster URL to a 300x450 SVG (registered after the fixtures' route that blocks other hosts, so it wins), opens the Artwork tab, and types that URL into `season[poster]` so the preview shows it. Check that the preview's box lies inside `#edit-show .modal-body`, that its width/height ratio is 2:3, and that the Upload label, OK and Cancel pass `click({ trial: true })`. Run it and verify it fails because the image runs past the body and covers the footer
- [x] 2.2 Add a second test the same way with a 1600x900 SVG; check that the preview is 450px wide, and verify it passes before and after the fix
- [x] 2.3 In `public/css/modals.css`, give `#artwork img` a `max-height` that leaves room for the URL field and its message inside the 600px body, plus `object-fit: contain`, so a tall image is scaled into a full-width box and centred. Keep `width: 450px` and the `-15px` margin so landscape art is unchanged. Verify both new tests and the rest of `e2e/artwork.spec.js` pass
- [x] 2.4 Make the vertical test check that the Upload label, OK and Cancel are wholly in the viewport before any click (Playwright scrolls the dialog's clipped overflow to reach a click target), and verify it fails with OK out of view because the header's poster grows to 180px; then give `#edit-show .edit-poster img` `max-height: 120px` (square art's height today, so it is unchanged) and `object-fit: contain`, and verify `e2e/artwork.spec.js` passes

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and the whole Playwright suite, and verify they all pass
- [x] 3.2 Take dark and light screenshots of the edit dialog's Artwork tab at 1500x900 with a vertical poster and with landscape art, open them, and get the user's approval
- [x] 3.3 Run `openspec validate fit-vertical-artwork --strict` and verify it passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff and wait for the user's picks before committing.
- Commit the code, then archive the change as `Archive fit-vertical-artwork`, and open one PR with `gh`.

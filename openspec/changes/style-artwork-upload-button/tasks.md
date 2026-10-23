# Tasks

## 1. Upload button

- [x] 1.1 Extend the edit-modal spec in `spec/artwork_upload_spec.rb`: the URL field and the file input share an `.input-group`, the file input has `id="artwork-file"` and `class="sr-only"`, and the next element is `label[for="artwork-file"].btn.btn-default` reading "Upload" (the existing accept, data-upload, message and URL field checks stay). Show it failing, then change `_edit_show.erb` as in design.md until it passes, and run the whole suite

## 2. Styles and versioned imports

- [x] 2.1 Add a spec in `spec/page_assets_spec.rb` asserting that `dark.css` and `default.css` import `themes/<theme>/modals.css?v=<n>` and that `GET /css/themes/dark/modals.css?v=2` serves the same body as without the query. Show it failing, then version both imports with `?v=2` until it passes
- [x] 2.2 Add the label's focus ring (`#artwork-file:focus + label`) and full-height padding to both themes' `modals.css`, and run the whole suite

## 3. Visual check and integration

- [x] 3.1 Check in the browser against a throwaway local database with S3 stubbed, in both the dark and default themes: the button matches the dialog's buttons and the field's height, clicking it opens the chooser and uploads, a rejected file shows its message, and tabbing to it shows the focus ring
- [x] 3.2 Run the whole suite and `openspec validate style-artwork-upload-button --strict`, and verify both pass

## Workflow follow-up

- Archive the change as the last commit of the change's PR, and open the PR with `gh`.
- After merge: `cd ~/MMDb && git pull --ff-only && docker compose restart web`, then check that the live `dark.css` imports `modals.css?v=2`.

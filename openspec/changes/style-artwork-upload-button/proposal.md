# Proposal

## Why

The artwork tab's file picker is the browser's native control ("Choose File" / "No file chosen"), so it looks foreign next to the dialog's Bootstrap buttons in both themes. Because it sits on its own row, it also reads as a separate feature, when uploading and pasting a link both set the same poster.

## What Changes

- The picker becomes an "Upload" button styled like the dialog's other `btn-default` buttons, attached to the right end of the poster URL field as one control.
- The native file input stays in the page, visually hidden but focusable, so the button keeps working from the keyboard and for screen readers. A visible focus ring appears on the button when that input has focus.
- The upload behavior, messages and save path are unchanged.
- The `modals.css` imports in `dark.css` and `default.css` get a hand-raised `?v=` version, so the new styles reach browsers without a hard reload. The `page-assets` spec records that imported theme files are versioned this way.

Out of scope: focus styling for the dialog's other buttons (they hide focus today), and adding versions to the other imports before their files change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `show-artwork`: "Artwork tab offers a file upload" now describes the picker as a dialog-styled button attached to the URL field, reachable and visibly focused from the keyboard.
- `page-assets`: adds how stylesheets imported by the theme files are versioned.

## Impact

- `app/views/partials/_edit_show.erb` (artwork tab markup).
- `public/css/themes/dark/modals.css` and `public/css/themes/default/modals.css` (focus ring and full-height padding).
- `public/css/dark.css` and `public/css/default.css` (versioned `modals.css` import).
- `spec/artwork_upload_spec.rb` (modal markup) and `spec/page_assets_spec.rb` (imports).
- No JS, route, dependency or setting changes.

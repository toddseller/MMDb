# Proposal

## Why

`merge-theme-stylesheets` and `add-system-theme` put the page, the drawer and the show editor's body onto the palette. Every other dialog, and every form field and plain button, still gets Bootstrap's built-in light colours. In the dark theme (or System on a dark device), Account Settings, Sign In, Add Movie, Edit Movie, Add Show, the ratings form and the rest open as white boxes. The fields inside the show editor are white as well. Since `color-scheme` now draws the browser's own widgets dark, a dark native control can end up sitting inside a white Bootstrap field.

## What Changes

- Every dialog's box (`.modal-content`) takes the theme's surface and text colours, following the show editor: `--surface` behind the body and footer, `--text` for its text. The footer divider follows the theme too.
- Every form field (`.form-control`: text, email, password, textarea, select) is raised in the dark theme: a `#2b2b2b` field with a `#555` edge on the `#222` dialog, with theme-coloured text. Disabled fields follow the theme as well.
- Plain buttons (`.btn-default`) follow the theme, along with their hover, focus and pressed states.
- The Theme picker's checked button, the sign-in dialog's Remember me checkbox and the sign-in dialog's fixed `#333` text take their colours from the palette rather than fixed light values.
- The show editor's own button overrides are reduced to what still differs once plain buttons are themed. `--button-focus-bg`, which paints a focused button white in the dark theme, is deleted if nothing uses it after that.
- The light theme looks exactly as before: the light side of every new colour is the value Bootstrap or the old rule shows today.
- Unchanged in both themes: the sign-in dialog's red header, the red danger buttons and the blue focus glow on fields.

Out of scope: restyling the layout or size of any dialog or field, Bootstrap's other components (none are in use beyond these), and the show editor's grey header band, which stays its own.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `themes`: adds a requirement that dialogs, form fields and buttons follow the theme, with the light theme unchanged.

## Impact

- `public/css/palette.css`: new field, button and divider colour pairs.
- `public/css/modals.css`: themed `.modal-content`, `.form-control`, `.btn-default` and `.modal-footer` rules; the Theme picker and show editor rules use palette colours.
- `public/css/dialog.css`: the Remember me checkbox uses palette colours.
- `public/css/app.css`: raised `?v=` versions for each changed import.
- Fields outside dialogs share `.form-control`, so the collection filter box and the Add Movie search turn dark in the dark theme too. The red sign-up panel keeps light fields in every theme.
- Tests: `spec/themes_spec.rb` keeps palette-only colours, and e2e checks cover a dialog, a field and a button in both themes.
- No change to HTML, JavaScript, the server or the database.

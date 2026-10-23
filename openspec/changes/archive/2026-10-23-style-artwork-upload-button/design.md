# Design

## Context

The artwork tab has the URL field (`season[poster]`, a full-height `form-control`) and, on its own row, a native `<input type="file" name="artwork">` that `uploadArtwork` in `mmdb.js` listens to through a delegated `change` handler. Dialog buttons are Bootstrap 3 `btn btn-default`, which both themes shrink inside `#edit-show` to `padding: 3px 12px` and style without any focus outline. Theme styles live in `themes/{dark,default}/modals.css`, which `dark.css` and `default.css` pull in with `@import`.

## Goals / Non-Goals

**Goals:**
- The picker looks like the dialog's buttons in both themes without copying their CSS.
- Keyboard and screen-reader use keep working, with focus made visible.

**Non-Goals:**
- Restyling or fixing focus on the dialog's other buttons.
- Any JS change.

## Decisions

### A label styled as a button, the input hidden with `.sr-only`
```html
<div class="input-group">
  <input type="text" class="form-control" name="season[poster]" ...>
  <span class="input-group-btn">
    <input type="file" id="artwork-file" class="sr-only" name="artwork" accept="image/jpeg,image/png" data-upload="...">
    <label for="artwork-file" class="btn btn-default">Upload</label>
  </span>
</div>
<p class="artwork-message help-block"></p>
```
Clicking a `<label for>` opens its file input's chooser in every browser, and `.sr-only` (clip rather than `display: none`) keeps the input in the tab order and the accessibility tree. The existing handler's selector, `input[name="artwork"]`, still matches.
*Alternative:* styling `::file-selector-button`. Rejected: it copies `.btn-default` into both themes by hand, and the browser's "No file chosen" text stays next to the button and reads wrong after every upload, because the handler clears the input.

### Focus ring on the label only
`#artwork-file:focus + label` gets an outline in each theme's `modals.css`. Placing the input immediately before the label lets a sibling selector reach the label without JS. The ring uses `outline` so it doesn't shift the layout.

### Height
The `#edit-show .btn` padding makes buttons shorter than a `form-control`. The rule for this label restores Bootstrap's default button padding (`6px 12px`) so it matches the field's 34px height. The field keeps its size. The visual check found that both themes put `margin-top: 15px` on `#artwork .form-control` to space it from the image, which inside the input group pushed only the field down by 8px; that spacing now sits on `#artwork .input-group`, and the field and button share their top edge and 34px height in both themes.

### Versioned imports by hand
`@import url('themes/dark/modals.css?v=2')` (and the same for `default`). Editing the line changes `dark.css` and gives it a new automatic version, so browsers refetch it, and it then refetches `modals.css`. Rack's static file server ignores the query string, so the same file is served. *Alternative:* moving the rules into `dark.css` and `default.css`, which are versioned automatically. Rejected, because those files are only import lists and the rules belong with the dialog's other styles.

## Risks / Trade-offs

- [Someone edits a theme file and forgets to raise its version] → Browsers keep the old file for up to 4 hours, the same as before #422, and nothing breaks. The `page-assets` spec and a spec that checks the import lines make the convention visible.
- [Safari historically ignored clicks on labels for hidden file inputs] → That applied to `display: none`; `.sr-only` clipping is unaffected. The visual check covers Brave, and Safari is checked if available.

# Design

## Context

`layout.erb` renders one `<link id="theme">` pointing at `default.css` or `dark.css`. `account.js` swaps its `href` when the theme switch flips. Each entry file `@import`s:

- the shared `normalize`, Bootstrap 3, `navigation`, `drawer`, `dialog` and `responsive`;
- its own copies of `themes/<theme>/layout.css`, `modals.css` and `movies.css`.

The per-theme copies hold about 31 distinct colours each. The shared files already use one custom property, `--gutter`.

## Goals / Non-Goals

**Goals:**
- One copy of every layout rule.
- Each theme colour written once, with its light and dark value side by side.
- No visible change in the dark theme, and in the light theme none except taking on the dark theme's layout.

**Non-Goals:**
- Changing how the theme is chosen, stored or switched. That belongs to `add-system-theme`.
- Renaming selectors, restructuring rules or cleaning up CSS beyond deleting dead rules.
- Theming Bootstrap's own colours beyond the overrides the themes already have.

## Decisions

### Keep the two entry stylesheets; each sets `color-scheme`

`default.css` and `dark.css` keep their names and import the same list. They differ in one rule after the imports: `:root { color-scheme: light; }` or `:root { color-scheme: dark; }`.

- This leaves the HTML, the theme switch, `account.js` and every test that looks for those two URLs untouched, which keeps this change pure CSS.
- *Alternative:* switching to a `data-theme` attribute now. It's needed for "system", but doing it here mixes a behaviour change into what should be a no-visible-change PR. `add-system-theme` does it.

### Colours as `light-dark()` custom properties in `palette.css`

`palette.css` defines `:root { --name: light-dark(<light>, <dark>); ... }`, and the shared files use `var(--name)`. `light-dark()` picks a side from the element's `color-scheme`, which the entry file sets on `:root` and every element inherits.

- Each colour is one line, and adding "system" later needs no second copy of the dark values.
- *Alternative:* a `:root { ... }` block plus a `[data-theme=dark] { ... }` block. It works for two themes, but "system" would need the dark block a second time inside a `prefers-color-scheme` query.
- *Alternative:* a shared base plus a dark override file. This keeps two places per colour, and overrides have to match the base's selectors exactly. That's the same drift problem in a smaller form.
- Variables are named by role (`--page-bg`, `--text`, `--muted`, `--line`, `--poster-bg`), not by value. A colour that is the same in both themes stays a literal in the shared file, with no variable.
- Browser support for `light-dark()`: Chrome 123, Safari 17.5, Firefox 120. An older browser drops those declarations and shows Bootstrap's defaults (light). That's acceptable for a personal collection site.

### How each difference is merged

The merge starts from the dark copy, which carries most of the later fixes, keeping its rule order, since order decides the cascade. Light-only rules are then folded in.

- **A colour that differs:** `var(--x)`, with `--x: light-dark(<light>, <dark>)`.
- **A colour set in only one theme:** the other side of `light-dark()` is the value that theme actually showed, read from the browser's computed style (often Bootstrap's), not "unset". The screenshot comparison catches a wrong guess.
- **A shorthand mixing colour and layout** (`border`, `background`): the layout part stays literal and the colour becomes a variable, e.g. `border: 1px solid var(--line)`. `background: none` against `background: #222` becomes `background-color: light-dark(transparent, #222)`.
- **A non-colour value that differs** (size, position, display, margin, font): `light-dark()` can't express it, and a theme shouldn't change layout. It takes the dark theme's value: the dark theme is the maintained design, and the light theme fell behind it (the owner's call). If an opacity difference turns out to be a real theme difference, it is folded into the colour's alpha.

### Drift to settle

Every row takes the dark theme's layout. The light theme keeps its own colours, with light-only colours becoming the light side of `light-dark()`. Screenshots of each row in the light theme are shown to the owner as a check, not a choice.

| # | Where | Light | Dark | Pick |
|---|---|---|---|---|
| 1 | Ratings row (`#ratings-container`, `.rated p`, `.rating p`) | `position: absolute; left: 95px; width: 200px` | `inline-flex`, centred | Dark (fixes the phone overlap) |
| 2 | `.description-info` | `position: relative` | `inline-flex`, centred | Dark |
| 3 | `.series-details`, `.series-details .spacing` | none | flex row, 10px gaps | Dark |
| 4 | HD/Standard switch (`.showonoffswitch*`, used in `_edit_show.erb`) | none | full switch | Dark |
| 5 | Close button states (`.close`, `#meta-data .close`, hover/focus) | opacity .2/.5, colour #000 | `text-shadow: none`, Bootstrap's opacity | Dark |
| 6 | Form checkboxes (`.form-horizontal .checkbox`, `.checkbox.isnew`, `.checkbox label`, `#sign-in-form .checkbox`) | none | padding and margins reset | Dark |
| 7 | `.movie-content` (sign-in dialog) | none | 600px tall, #222, red close | Dark |
| 8 | `.modal-body hr`, `.description-details > .modal-title` margins | none | 10px / 0 | Dark |
| 9 | `#description-rating` font | `'Gotham Bold', serif` (Gotham is never loaded) | `'Times New Roman', serif` | Dark (same rendering today) |
| 10 | `.movie-preview` margin-right | 1em | 2em | Dark |
| 11 | `#scroll-left/right` top, height, icon line-height | 87px, 200px, 4em | 53px, 263px, 5em | Dark |
| 12 | `.index-preview-show img` height | auto | 213px | Dark |
| 13 | `#update-search` margin-right | none | 15px | Dark |
| 14 | `#show-scroll-left/right`, `.glyphicon-option-vertical` | rules | none | Delete: no markup uses them |

### Proving nothing else moved

- Before the merge, a throwaway Playwright script (kept in the scratchpad, not committed) screenshots these pages in both themes at 1500px and 390px:
  - signed out: the sign-in page and the registration page;
  - the movies page, a movie drawer, the movie edit dialog;
  - the shows page, a show drawer, the show edit dialog with each tab;
  - Account Settings, the search dialog.
  It is run against a `git worktree` of `master` for the baseline, then against the branch, and every pixel is compared.
- Any difference must map to an approved row of the table. Anything else is a merge mistake and gets fixed.
- What stays committed is cheap structure checks:
  - `palette.css` holds only custom properties whose values are `light-dark(...)`;
  - the two entry files import the identical list and differ only in their `color-scheme`;
  - `themes/` is gone;
  - an e2e test for the ratings row on a phone runs in both themes.

## Risks / Trade-offs

- [The merged cascade differs subtly from either copy] → The full-page pixel comparison in both themes and at both widths is the check, not reading the CSS.
- [A colour set in only one theme gets the wrong other side] → It's read from computed style in that theme, and the pixel comparison catches a mistake.
- [Anti-aliasing noise in screenshots] → Baseline and branch are shot on the same machine and browser build. A difference that isn't on an approved item is investigated, not tolerated by a threshold.
- [Browsers without `light-dark()`] → They fall back to Bootstrap's light defaults. Accepted.

## Migration Plan

Static files only. New `?v=` versions on every changed import make browsers fetch them on deploy. Rollback is reverting the PR.

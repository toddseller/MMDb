# Design

## Context

`app.css` imports Bootstrap 3 and then the app's own stylesheets. `palette.css` holds every theme colour as `light-dark(<light>, <dark>)`, and `color-scheme` on the page picks the side. The app's rules override Bootstrap only where they already did before the merge, so these Bootstrap colours still show in both themes:

| Bootstrap rule | Colours |
|---|---|
| `.modal-content` | `#fff` background |
| `.modal-footer` | `#e5e5e5` top border |
| `.form-control` | `#fff` background, `#555` text, `#ccc` border, `#999` placeholder |
| `.form-control[disabled]`, `[readonly]` | `#eee` background |
| `.btn-default` | `#fff` / `#333` / `#ccc` |
| `.btn-default` hover, focus, active | `#e6e6e6` background, `#adadad` or `#8c8c8c` border |
| `.btn-default` pressed while active or focused | `#d4d4d4` background, `#8c8c8c` border |

The app's own fixed light colours are:

- `.theme-choice .btn:has(:checked)`: `#e6e6e6` / `#adadad` (`modals.css`);
- `#logIn .modal-content { color: #333 }` (`modals.css`);
- the Remember me checkbox: `#fff` / `#ccc` (`dialog.css`);
- `.btn-default.disabled.edit-next`: `#e0e0e0 !important` (`modals.css`).

`#edit-show` already themes its body and footer with `--surface` and its header with `--dialog-header-bg`. Its `.btn-default` hover and focus rules use `--button-focus-bg` (`transparent` light, `#fff` dark). The effect is to keep a hovered button looking unhovered, which in the dark theme means white, matching Bootstrap's white button. No script sets colours, so CSS alone reaches every dialog.

## Goals / Non-Goals

**Goals:**
- No Bootstrap light colour left showing in the dark theme on dialogs, fields or plain buttons.
- The light theme pixel-identical to today.

**Non-Goals:**
- Giving other dialogs the show editor's grey header band. Their headers keep the box's colour, as they do today.
- Theming Bootstrap components the app doesn't use.
- Changing the `#757575` active button in the show editor, the red danger buttons or the `#66afe9` focus glow. Each reads on both a light and a dark box.

## Decisions

### Override Bootstrap's colour declarations, not its stylesheet

New rules in `modals.css` restate only the colour properties of the Bootstrap selectors above, using palette variables. They load after Bootstrap, so the same selectors win on order.

- *Alternative:* editing `bootstrap.min.css`. Bootstrap is vendored and minified, so a later re-vendor would silently drop the change.
- *Alternative:* a scoped `[data-theme] .modal ...` block per dialog. That's more selectors for the same result, and it misses the fields outside dialogs.

### Light side copies Bootstrap; dark side follows option A (raised fields)

New palette entries, each named by role:

| Variable | Light | Dark | Used by |
|---|---|---|---|
| `--field-bg` | `#fff` | `#2b2b2b` | `.form-control`, `.btn-default`, Remember me |
| `--field-text` | `#555` | `#f3f3f3` | `.form-control` |
| `--field-edge` | `#ccc` | `#555` | `.form-control`, `.btn-default`, Remember me |
| `--field-disabled-bg` | `#eee` | `#222` | disabled and read-only `.form-control` |
| `--button-hover-bg` | `#e6e6e6` | `#3a3a3a` | `.btn-default` hover, focus, active; Theme picker's checked button |
| `--button-hover-edge` | `#adadad` | `#777` | the same |
| `--button-press-bg` | `#d4d4d4` | `#474747` | `.btn-default` pressed while active or focused |
| `--button-press-edge` | `#8c8c8c` | `#888` | `.btn-default` focus and pressed borders |
| `--button-disabled-bg` | `#e0e0e0` | `#222` | `.edit-next` when disabled |
| `--divider` | `#e5e5e5` | `#333` | `.modal-footer` top border |

`.modal-content` takes `--surface` (light `#fff`, the same as Bootstrap's). Its text already inherits `--text` from the page, since `dialog.css` sets `color: inherit` on the dialog, so `#logIn`'s fixed `#333` (which is `--text`'s light side) is deleted. Button text uses `--text` too, whose light side is Bootstrap's `#333`.

- Raised fields (`#2b2b2b` on the `#222` box) echo the show editor's `#2b2b2b` header. The owner chose this over sunken fields.
- `--page-bg` isn't reused for fields, even though its dark side is the same `#2b2b2b`: its light side is `#eaeaea`, which would grey every light-theme field.
- A disabled field is flush with the box (`#222`) rather than raised, so it reads as inactive while its edge still shows where it is.
- The placeholder stays Bootstrap's `#999` in both themes: it has about 5:1 contrast on `#2b2b2b`, so it needs no variable.
- The dark values are a first pick. The screenshot review in tasks may adjust them, as long as the light side stays fixed.

### The show editor's overrides keep their effect with fewer special cases

`#edit-show .btn-default:hover` and `#edit-show .btn:focus` use `var(--field-bg)` in place of `var(--button-focus-bg)`. A hovered button keeps looking like an unhovered one in both themes. In the light theme `#fff` matches the old `transparent` over a `#fff` body. Their `border-color: #ccc` becomes `var(--field-edge)`. `--button-focus-bg` then has no users and is deleted. The `#757575 !important` active rule stays: it is the same in both themes, and the `!important` still has to beat Bootstrap's `.active:hover`.

### Fields outside dialogs come along, except on the red sign-up panel

`.form-control` is styled globally, so the collection filter box and the Add Movie search turn dark in the dark theme too. On the `#2b2b2b` page, a `#2b2b2b` field is told apart by its `#555` edge alone. Scoping to `.modal` would leave those fields white, which is exactly the problem this change removes.

The sign-up panel (`.registration`) is red in every theme, and dark fields on red read poorly, so the owner kept its fields white. `color-scheme: light` on the panel makes every palette colour inside it take its light side. The panel's own colours are fixed values, so nothing else in it changes.

## Risks / Trade-offs

- [The dark values are new colours no one has seen yet] → The screenshot review shows the owner every dialog in the dark theme before commit, and adjusts dark values only.
- [Missing one of Bootstrap's state selectors leaves a white flash on press or focus] → The override block copies Bootstrap's own selector lists for each state, and the e2e button check reads hover and focus colours.
- [A field on the dark page shows only its edge] → Accepted for this change. The filter box is in the screenshot review, so the owner sees it.
- [`light-dark()` needs Chrome 123, Safari 17.5 or Firefox 120] → Same floor as the palette already has. Older browsers fall back to Bootstrap's light values, as today.

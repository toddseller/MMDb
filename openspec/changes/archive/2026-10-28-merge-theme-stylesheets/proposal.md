# Proposal

## Why

The light and dark themes are two full copies of the same three stylesheets (`themes/default/*` and `themes/dark/*`, about 1,850 lines each). Compared rule by rule, about 640 declarations are identical and only about 75 are real theme differences, all of them colours. The other roughly 120 are fixes made in one copy and never in the other, so each theme has bugs the other doesn't:

- the light theme positions the ratings row absolutely, and on a phone it overlaps the runtime and genre;
- the light theme doesn't style the show edit dialog's HD/Standard switch at all;
- spacing, the poster scroll arrows and show tile heights differ for no reason.

Every future layout fix has to be made twice, and it is easy to forget the second time.

## What Changes

- The two copies of `layout.css`, `modals.css` and `movies.css` become one copy each, shared by both themes.
- Each theme colour becomes a custom property in a new `palette.css`, written once as `light-dark(<light>, <dark>)`.
- `default.css` and `dark.css` stay as the two entry stylesheets. They import the same files, and each sets `color-scheme` to its own theme, which picks the side of each `light-dark()`. The page, the theme switch and the saved setting work exactly as before.
- Because `color-scheme` is now set, native scrollbars and form controls follow the theme too.
- Each layout difference between the themes takes the dark theme's value, since the dark theme is the maintained design (design.md lists them). Rules that match no markup (`#show-scroll-left/right`, `.glyphicon-option-vertical`) are deleted.
- The dark theme looks exactly as before, apart from the browser's own scrollbars and form controls turning dark. The light theme changes only where it takes on the dark theme's layout. Screenshots compared pixel for pixel before and after show this.

Out of scope: a "system" theme option and the theme for signed-out visitors (the follow-up change `add-system-theme`), Bootstrap's own stylesheet, and the shared `drawer.css`, `dialog.css`, `navigation.css` and `responsive.css` beyond moving any theme colours they contain into the palette.

## Capabilities

### New Capabilities

- `themes`: what the light and dark themes have in common and how they differ: one layout, differing only in colour.

### Modified Capabilities

- `page-assets`: the requirement on versioning imported theme stylesheets now covers the shared stylesheets, since there are no per-theme copies left.

## Impact

- `public/css/themes/` is deleted.
- New shared `public/css/layout.css`, `modals.css`, `movies.css` and `palette.css`.
- `public/css/default.css` and `public/css/dark.css` are reduced to imports and one `color-scheme` rule each.
- Tests:
  - `spec/detail_drawer_spec.rb` and `spec/page_assets_spec.rb` check the shared files in place of the per-theme ones;
  - new structure checks cover `palette.css` and the entry files;
  - an e2e check covers the ratings row on a phone in both themes.
- No change to HTML, JavaScript, the server or the database.

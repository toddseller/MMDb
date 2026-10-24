# Design

## Context

What still needs jQuery and Bootstrap's JavaScript:

| Piece | Where | Bootstrap feature |
| --- | --- | --- |
| `#logIn` (sign-in, and Account Settings loaded into its `.modal-content`) | `layout.erb`, `account.js` | modal, `shown.bs.modal` (autofocus), `hidden.bs.modal` (reset, theme restore) |
| `#movie` (a movie's details, loaded into `.modal-content`) | `layout.erb`, `navigation.js` | modal |
| `#edit-show` (edit and Create New Show; `show-edit.js` replaces the dialog's whole inner HTML) | `layout.erb`, `show-edit.js` | modal |
| Sign in button | `layout.erb` | `data-toggle="modal" data-target="#logIn"` |
| × buttons | `layout.erb`, `_modal.erb`, `_preview_modal.erb`, `_edit_user.erb` | `data-dismiss="modal"` |
| Tab buttons | `_edit_show.erb`, `_create_show.erb` | `data-toggle="tab" href="#pane"`; `show-edit.js` already moves `.active` between the buttons |

All modal calls go through `public/js/mmdb/bootstrap.js`. No module calls jQuery directly; the remaining mentions are comments.

The styling is split. The theme files `themes/{default,dark}/modals.css` make `.modal` a fixed box centered with `transform: translate(-50%, -50%)` and `display: none`. `bootstrap.css` adds `.fade` and `.fade.in` (opacity), `.modal.fade .modal-dialog` (a -25% slide), `.modal-backdrop`, `.modal-open` (no page scroll) and `.tab-content > .active`. Because the theme shrinks `.modal` to the box, Bootstrap's "click on `.modal` itself" check never fires on the backdrop. That is why a click outside does nothing today.

jsdom has `HTMLDialogElement` and its `open` property, but no `showModal`, `close`, `getAnimations` or `matchMedia`. e2e runs in Chromium only.

## Goals / Non-Goals

**Goals:**
- The dialogs look and behave as today, plus what the browser gives `<dialog>` for free (focus kept inside, page inert, focus returned on close) and the Enter fix.
- One place opens and closes dialogs, so the fade-out can't be skipped by a path that calls the browser directly.

**Non-Goals:**
- ARIA tab roles for show edit's tabs, accessible names for the dialogs, or any restyle.
- Replacing `bootstrap.css`, or removing its now-unused `.modal-backdrop` and `.modal-open` rules from the vendor file.
- Closing on a click outside (see proposal).
- The deferred follow-ups: a season's only episode being deleted, "Adding…" left after a failed add, responsive layout.

## Decisions

**`<dialog class="modal">`, keeping the class.** The three layout `div.modal`s become `<dialog class="modal" id="…">` with the same `.modal-dialog > .modal-content` inside. Keeping `.modal` keeps every theme rule (position, size, colors) as it is. `fade`, `role="dialog"` and `tabindex="-1"` go: `<dialog>` has the role and focus handling built in. `fade` must go because `bootstrap.css`'s `.fade` is `opacity: 0` until `.in`, which nothing adds now. Alternative: keep `div`s and toggle Bootstrap's classes by hand. Rejected: that rebuilds the backdrop, Escape, focus and inertness the browser already provides.

**One shared `public/css/dialog.css`, imported by both themes.** It is shared the way `drawer.css` is, and imported as `dialog.css?v=1` from `default.css` and `dark.css`, per the page-assets spec. It holds:
- `dialog.modal[open] { display: block }`. Specificity (0,2,1) beats the theme's `.modal { display: none }`, so the theme files stay untouched.
- resets for the browser's dialog defaults that the theme doesn't set: `border`, `padding`, `margin`, `background`, `color`, `max-width`, `max-height`
- `dialog.modal::backdrop`: black at 0.5, as `.modal-backdrop.in` was
- `html:has(dialog.modal[open]) { overflow: hidden }`, the old `.modal-open`, with `html { scrollbar-gutter: stable }` on every page. Bootstrap padded the body to make up for the scrollbar it hid; keeping the gutter all the time means classic scrollbars (Windows) shift nothing, neither when a scrollbar is hidden nor when a short page would otherwise gain a gutter. Found in review.
- the fade, below

**The fade: CSS draws it, `dialog.js` holds the close until it finishes.** Inside `@media (prefers-reduced-motion: no-preference)`:
- `dialog.modal` transitions `opacity` over .15s linear, and its `.modal-dialog` `transform` over .3s ease-out. Its `::backdrop` transitions `opacity` over .15s. These are Bootstrap's values.
- Bootstrap runs the layers in sequence, and so does this. Opening, the backdrop fades in first and the box follows .15s later. Closing, the box goes first and the backdrop .15s later. A transition takes its delay from the state being entered, so the open state delays the box and `.closing` delays the backdrop. Found by sampling both versions' opacities and offsets every 50ms.
- `@starting-style` gives the open state's start: opacity 0, the slide at `translate(0, -25%)`, the backdrop at 0. Opening is pure CSS.
- `dialog.modal.closing` sets the same end values, so adding the class runs the fade-out.

`close()` in `dialog.js` adds `.closing` and waits for the fade's own animations to settle, then calls the browser's `close()` if the dialog is still `.closing`. The dialog's `close` event removes `.closing`.

The fade's own animations are those in `getAnimations({ subtree: true })` whose target is the dialog itself (its fade and its `::backdrop`'s, which only `subtree` lists) or its `.modal-dialog`. The unfiltered subtree, as first planned, also returns a focused field's border transition from `bootstrap.css` (found when the reduced-motion test failed), and an animation inside a dialog that never ends would hold the close forever. Without the backdrop, show edit (which has no `.modal-dialog`) would close before its backdrop's delayed fade-out ran.

Why `getAnimations()` and not `transitionend`: it returns the running transitions in one list. When nothing runs, because of reduced motion or a browser without the transition, the list is empty and the dialog closes at once. `transitionend` fires once per property per element, bubbles up from the children, and never fires when there is no transition, so a close could hang. `Promise.allSettled` is used because reopening cancels the transitions, and a cancelled animation's `finished` rejects.

Alternatives:
- **Web Animations through `motion.js`.** Rejected: animating `::backdrop` with `animate({ pseudoElement })` isn't reliable across browsers, and the CSS entry needs no JS.
- **CSS-only exit with `transition-behavior: allow-discrete` and `overlay`.** Rejected in explore: `overlay` is Chromium-only, so the close fade wouldn't run in Safari or Firefox.

**Reopening during the fade-out keeps the dialog open.** `open()` removes `.closing`, which reverses the transitions, and calls `showModal()` only when the dialog isn't already open. The pending close sees `.closing` gone and does nothing.

**Escape goes through the same close.** One `cancel` listener on `document` in the capture phase (`cancel` doesn't bubble, but capture still sees it) calls `preventDefault()` and then `close()` for any `dialog.modal`. Chrome lets a page prevent `cancel` only once between user activations. A second quick Escape may close the dialog natively mid-fade; the `close` event still clears `.closing`, so the dialog ends up correctly closed.

**`dialog.js` API.** `open(document, id)`, `close(document, id)` (returns the promise, for tests) and `init(document)`. `init` binds the `cancel` capture and a delegated click on `[data-close]` that closes the enclosing dialog. Callers pass the dialog's id: `logIn`, `movie`, `edit-show`. `main.js` calls `init` first.

**Bootstrap attributes are replaced.**
- `data-dismiss="modal"` becomes `data-close` on the four × buttons.
- The Sign in button gets `id="open-sign-in"` and loses `data-toggle`/`data-target`; `account.js` opens `logIn` on its click, next to the sign-in code it already owns.
- `show-edit.js`'s Cancel calls `close(document, 'edit-show')`, as do its other closes.

**`account.js` drops its Bootstrap events.**
- The `shown.bs.modal` autofocus handler is deleted: `showModal()` focuses the `[autofocus]` field.
- The `hidden.bs.modal` handler becomes `close` on `#logIn`, which is in the layout on every page. So the reset and the theme restore run after the fade, once the dialog is out of sight.
- The successful save still updates the saved theme before it closes the dialog.

**Show edit's tabs.** `data-toggle="tab"` becomes `data-tab`, keeping `href="#pane"`. The existing handler, now on `#edit-show [data-tab]`, also removes `.active` from the sibling panes and adds it to the pane its `href` names, found inside `#edit-show`. Both partials use `#season`, but only one partial is ever in the dialog. The `.tab-content > .active` rule in `bootstrap.css` does the showing.

**Enter acts as OK.** A `keydown` handler on `#edit-show input[type="text"]` takes Enter, calls `preventDefault()` (which also stops the native post) and runs `ok(document)`. It ignores Enter while an input method is composing, since that Enter picks the composed text, and a held key's repeats, which would save again (in Create New Show, add the episode again) before the first save lands. The repeat rule was found in review. Textareas are left alone, so Enter there still adds a new line.

The form's `submit` event was the first plan, but it falls short. A form with no submit button only submits on Enter when it has exactly one single-line field. That covers the edit dialog's Details and Artwork forms, which is where the error page came from. It misses the Season form and every Create New Show form, where Enter did nothing at all.

**Unit tests stub the dialog API.** `spec/js/dom.js` gains `stubDialogs(window)`:
- it gives `HTMLDialogElement.prototype` a `showModal` that sets `open`, and a `close` that clears it and dispatches `close`
- it gives each dialog a `getAnimations` that returns nothing unless a test hands it pending animations

`account.test.js`, `navigation.test.js` and `show-edit.test.js` lose their `window.$` fakes and assert on `open`. Closes are now async, so those tests await them. `dialog.test.js` covers open, close after the animations settle, immediate close with none, Escape, `[data-close]` and reopening mid-fade.

**Browser tests.** A new `e2e/dialogs.spec.js` covers the dialogs spec:
- Escape closes after a moment
- `page.emulateMedia({ reducedMotion: 'reduce' })` closes at once
- a click on the backdrop leaves the dialog open
- the page doesn't scroll behind
- Tab stays inside
- focus returns to Sign in

`show_edit.spec.js` gains the Enter scenarios. `smoke.spec.js` asserts `window.jQuery` is undefined and no request went to `ajax.googleapis.com`. The existing tab test in `modals_tabs.spec.js` keeps guarding the panels.

## Risks / Trade-offs

- **The browser's dialog defaults could shift the layout** (the movie dialog's 1100px width against the default `max-width`, the default padding and margin) → `dialog.css` resets them. The tasks include screenshots of all three dialogs in both themes at 1500x900, compared with production.
- **Safari and Firefox aren't in e2e**, and the fade, `:has()` and `@starting-style` are the parts most likely to differ → listed as a workflow follow-up: open and close each dialog in Safari after deploy. `@starting-style` needs Safari 17.5 or Firefox 129; older browsers open without the fade-in, but still fade out.
- **The fade-out timing test could flake** if the runner is slower than .3s between Escape and the check → the test reads `open` straight after the key press, and also asserts the dialog is gone within Playwright's normal wait, so only an extremely slow runner fails it.
- **A close path that calls the browser's `close()` directly would skip the fade** → `dialog.js` is the only module that calls `showModal`/`close`, which a grep in the review checks.
- **Optimizely's old snippet might have used the page's jQuery** → it is the classic snippet, which ships its own; analytics aren't part of the site's behavior, and e2e blocks it anyway.

## Migration Plan

Merge, then publish a release tag as usual; no data or server change. Rollback is a redeploy of v2026.10.24.13.

# Design

## Context

`public/js/mmdb/account.js` already runs a live check on both password forms. Account Settings' `confirmChanged` runs on every keystroke in the new or confirm field, colors the confirm border and holds Update, but shows no text; its warning line `#no-match` (red in `modals.css`) is never written. Registration's `checkRegistration` runs 1.5 seconds after typing stops and writes "Passwords do not match" into `#no-match2`. The `#logIn` dialog holds the sign-in form when signed out and the Account Settings form when signed in, so the two never share a page, but the registration page and settings both use `id="confirm"` on a wrapper `div` that CSS and JS select on (`#confirm > span`).

## Goals / Non-Goals

**Goals:**
- One message line per form says why the button is held, styled by the page, not the browser.
- Labels and `autocomplete` hints on every field of the three forms.

**Non-Goals:**
- A byte check for the 72-byte maximum in the page. Counting UTF-8 bytes in the page is possible but the case is rare; the server keeps refusing it, and Account Settings reports that refusal (the new "too long" scenario).
- Restyling the warning lines or the forms.

## Decisions

- **Extend the existing checks, not `minlength`.** `minlength` triggers the browser's own bubble, which the owner ruled out. Both forms already hold their button and have a warning line, so the length becomes one more condition there.
- **One function decides the message.** A small `passwordProblem(password, confirm)` in `account.js` returns `'Use at least 8 characters'`, `'Passwords do not match'` or `''`, and both forms use it. Length first: a short password is the thing to fix before matching matters.
- **Count characters as Ruby does.** `[...password].length` counts code points, which is what `String#length` counts on the server; `password.length` would count an emoji twice and allow a 4-emoji password the server refuses.
- **Settings shows its message immediately.** It keeps its current timing (every keystroke), so "Use at least 8 characters" shows from the first character of a new password, alongside the red border it already shows. Registration keeps its 1.5-second pause.
- **Input ids take a form prefix**: `sign-in-`, `settings-`, `register-` plus the field (`settings-current`, `register-password`). The wrapper `div`s keep their existing ids, so CSS and `#confirm > span` don't change. `name` attributes stay as they are, since the server and the tests read them.
- **The sign-in "User Name or Email" field is `username`.** Password managers save and fill the account identifier from that hint whether it holds a user name or an email.

## Risks / Trade-offs

- [Tests use short passwords like `new` and `secret`] → They are updated to 8 or more characters; the settings e2e test that submitted `seven77` becomes a page-level test (Update stays held, message shows), and the dialog's server refusal is covered by a 73-character password instead.
- [A user who never changes their password sees "Use at least 8 characters" only after typing in the new field] → The fields are disabled until the current password has a value, so the message never shows for a save without a password change.

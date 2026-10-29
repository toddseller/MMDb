# Proposal

## Why

The Account Settings dialog labels its first password field "Current Password" but its placeholder says "Enter New Password to Update Password", and nothing says the field is only needed to change the password. Across the sign-in dialog, Account Settings and the registration page, no `<label>` points at its field, no field tells a password manager what it holds, and the 8-character minimum is only mentioned after the server refuses a save. A password manager that knows which field is the new password offers to update the saved one, which is the step that was missed when the MMDb password changed but the saved entry did not.

## What Changes

- Account Settings: the current password placeholder becomes "Only needed to change your password"; the new password placeholder becomes "At least 8 characters".
- Registration: the password placeholder becomes "At least 8 characters".
- Account Settings and registration check the new password's length along with the match, in the forms' own styled warning line, and hold Update or Register until it has at least 8 characters and matches. The message is "Use at least 8 characters", ahead of "Passwords do not match". Account Settings now shows these messages as text, not only as a red border. No browser validation bubble is used.
- Every field in the three forms gets an `id` its label points at, and an `autocomplete` hint: `username`, `current-password`, `new-password`, `email`, `given-name`, `family-name`.
- The server's length rule is unchanged and still refuses a short or long password sent without the page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-account`: the password match checks in Account Settings and registration also check the 8-character minimum and say so; the dialog's server-refusal scenario uses a too-long password, since a short one can no longer be submitted from the dialog; the length rule's scenarios describe requests sent without the page; a new requirement covers labels, placeholders and autocomplete hints on the three forms.

## Impact

- Views: `app/views/layout.erb` (sign-in form), `app/views/partials/_edit_user.erb`, `app/views/users/new.erb`.
- Script: `public/js/mmdb/account.js` (settings and registration checks).
- Tests: `spec/js/account.test.js` (several examples use passwords under 8 characters), `e2e/account.spec.js` (the settings "under 8 characters is refused" test can no longer submit).
- No server, API or MyFlix change.

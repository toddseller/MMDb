# Design

## Context

What is left of `public/js/mmdb.js` is 25 functions bound by `bindListeners` and `dynamicListener`, which `public/js/application.js` calls on jQuery's ready. Three of them (`openMenu`, `closeMenu`, `goToProfile`) are bound by nothing.

The markup:
- `layout.erb`: the navbar ("Signed in as", `#menu-toggle`), the menu `#drop-down` with the Profile submenu, `#update` (Account Settings) and `#logout`, and the Bootstrap modals `#logIn` (the sign-in form), `#movie` and `#edit-show`.
- `_edit_user.erb`: Account Settings, loaded into `#logIn .modal-content`, replacing the sign-in form.
- `users/new.erb`: registration, a plain form post; only its password check is script.
- `users/show.erb` and `shows/show.erb`: another user's collection carries a `#user-shows` or `#user-movies` button; the menu carries both for the signed-in user.
- `users/index.erb` with `_top_movies.erb`: the home page's `.top-preview` posters.

The routes:

| Action | Request | Answer |
| --- | --- | --- |
| Sign in | `POST /sessions` with the non-empty fields | `{ status: 'true', user_id }` or `{ status: 'false' }` |
| Sign out | `POST /sessions/:id` | redirect to `/` |
| Account Settings | `GET /users/:id/edit` | the dialog |
| Save account | `PUT /users/:id` | `{ status: 'true', name, theme }` or `{ status: 'false' }` |
| Movies | `GET /users/:id` (XHR) | `{ page, movie_count }` |
| TV Shows | `GET /users/:id/shows` (XHR) | `{ page, show_count, episode_count }` |
| Poster preview | `GET /movies/:id/show` | the dialog |

Module conventions from changes 1 to 5 apply: `// @ts-check` with JSDoc, `#mmdb/` imports, `on()` delegation on `document`, `request()` and `fields()`, `init(document)` from `main.js`, and `show-edit.js`'s reach into Bootstrap's modal through `window.$`.

## Goals / Non-Goals

**Goals:**
- Account and navigation behave as today, apart from the fixes the proposal names.
- No app code reads jQuery except one file of Bootstrap calls that change 7 deletes.

**Non-Goals:**
- Replacing the Bootstrap modals, tabs or the Sign in button's `data-toggle`. That is change 7.
- The shows page's empty footer on a full page load; only the switch fills it, as today.
- Changing the URL on a Movies/TV Shows switch, or making the switch work for a signed-out visitor's menu (there is none).
- Registration's own submit, which stays a native form post.

## Decisions

**Two modules, `account.js` and `navigation.js`.** Account holds the forms that talk to the session and the user record; navigation holds what moves around the page. They share one thing: Account Settings closes the menu, so `navigation.js` exports `closeMenu`. Alternative: one `account.js` for everything left. Rejected: the Movies/TV Shows switch and the home preview have nothing to do with the account, and the spec split follows the same line.

**Bootstrap moves into `bootstrap.js`.** `show-edit.js` has a private `modal()` helper over `window.$`. Account and navigation need it too, plus Bootstrap's `shown.bs.modal` and `hidden.bs.modal`, which Bootstrap 3 triggers as jQuery events only, so `addEventListener` never sees them. One module exports `modal(document, selector, action)` and `onModal(document, selector, event, handler)`; `show-edit.js` switches to it. `legacy.d.ts` declares only those calls. Change 7 deletes the file and the declaration. Alternative: copy the helper into each module. Rejected: three copies of the jQuery seam for change 7 to find.

**Autofocus keeps today's reach.** `onModal` on `.modal`, the three layout modals, focuses the shown dialog's `[autofocus]` field. Only the sign-in field has one.

**Closing `#logIn` clears and restores.** On `hidden.bs.modal` for `#logIn`: reset the sign-in form if it is there, hide the error line, and put back the saved theme. Today only the close button cleared the form; Escape and the backdrop now do too, which is what the spec's "closing" means.

**One theme link, both URLs.** The layout renders `<link id="theme" rel="stylesheet" href="…" data-default="<versioned default.css>" data-dark="<versioned dark.css>">`. The switch sets `href` from the matching `data-*`. The module notes the `href` at load as the saved theme, replaces it with the shown one after a successful save, and restores it on close. Alternative: build the URLs in JS. Rejected: the `?v=` stamps come from `asset_path`, and the page-assets spec wants every stylesheet versioned.

**The light theme is stored as `default`.** `PUT /users/:id` saves `params[:theme] || 'default'`, in both branches, which is the column's default and what the layout checks for.

**Account Settings saves on submit.** `submit` on `#logIn .login-form` sends `PUT` to the form's action with `fields(form)`, which leaves out disabled fields as jQuery's `serialize` did. Enter submits only while Update is enabled, as native implicit submission skips a disabled default button. A refusal leaves Update enabled, as today, since the cleared current password no longer gates it.

**The password fields keep today's marks.** The confirm field's green or red border and glow stay inline styles, as today, so the CSS is untouched. The check runs on `input` rather than `keyup`, so paste counts.

**Registration waits on one timer.** The module keeps one timer and clears it on each `input` in the confirm field, so only the last pause is checked. The 1.5 seconds stay.

**One binding for the switch.** `on(document, 'click', '#user-movies, #user-shows', …)` replaces both of today's bindings. It `GET`s the link's `href`, puts `page` in `#user-page`, writes the footer as text, and closes the menu. The shows footer is built with the `\u2014` escape, the same character `&#8212;` gave.

**The menu marks one triangle.** Profile toggles `active` on `#user-profile`'s triangle; closing the menu clears it. Today closing looked for a `triangle-bottom` that doesn't exist, so the triangle stayed turned after the menu closed.

**Sign Out posts to `/sessions/<href>`** and then replaces the location with `/`, as today. The link's `href` is the bare user id.

**Deleting `mmdb.js` and `application.js`.** With every function moved or dead, both files and their `<script>` tags go. jQuery and `bootstrap.min.js` stay for Bootstrap.

## Risks / Trade-offs

- [The seed gains a second user.] → Its movie and show are its own, so user 1's counts and every existing test's numbers stay the same.
- [Closing the sign-in dialog any way now clears it.] → Intended; the spec says closing clears.
- [Account Settings on submit changes when a save is sent.] → Only Enter with Update disabled differs, and that sent nothing before either.
- [Bootstrap events through jQuery.] → Limited to `bootstrap.js`, which change 7 deletes.

## Migration Plan

An ordinary tagged deploy. No data changes; users whose theme was saved empty keep loading dark until they save again, which is what they see today. Rollback: publish a release for the previous tag's commit.

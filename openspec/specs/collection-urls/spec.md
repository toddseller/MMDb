# collection-urls Specification

## Purpose
Defines how a collection is addressed: each user's handle and its rules, the `/u/<handle>` addresses, the links that use them, and the redirects that keep older numeric and changed-handle links reaching the right collection.

## Requirements

### Requirement: Every user has a handle
Every user SHALL have a handle that no other user has, now or as an old handle: 3 to 30 characters of lowercase letters, digits and hyphens, starting and ending with a letter or digit.

#### Scenario: Unique
- **WHEN** two users exist
- **THEN** each has a handle, and the two differ

#### Scenario: Against the rules
- **WHEN** a handle of `to`, `-todd`, `to do` or 31 characters is saved for a user
- **THEN** it is refused

### Requirement: A handle is made from the user name
A user without a handle, existing or newly registered, SHALL get one made from their user name: lowercased, with accents dropped and every run of other characters turned into a hyphen, trimmed to 30 characters. When that is taken, `-2`, `-3` and so on SHALL be added; when it is shorter than 3 characters, the handle SHALL be `user-<their id>`.

#### Scenario: Made from the user name
- **WHEN** a visitor registers with the user name `Todd Seller`
- **THEN** their handle is `todd-seller`

#### Scenario: Taken
- **WHEN** a visitor registers with the user name `todd_seller` and `todd-seller` is already a handle
- **THEN** their handle is `todd-seller-2`

#### Scenario: No usable characters
- **WHEN** user 42 has the user name `!!`
- **THEN** their handle is `user-42`

#### Scenario: Existing users
- **WHEN** the change is deployed
- **THEN** every existing user has a handle made from their user name

### Requirement: A collection lives at its handle's address
A collection's movies SHALL be at `/u/<handle>` and its TV shows at `/u/<handle>/shows`, showing the same page as the numeric addresses did, for a full page load and for the page's own background requests. An address with an unknown handle SHALL answer 404. Handles in addresses SHALL be matched exactly as stored (lowercase).

#### Scenario: Movies
- **WHEN** a visitor opens `/u/todd-seller`
- **THEN** they see that user's movie collection

#### Scenario: TV shows
- **WHEN** a visitor opens `/u/todd-seller/shows`
- **THEN** they see that user's TV shows

#### Scenario: Unknown handle
- **WHEN** a visitor opens `/u/nobody-here`
- **THEN** the response is 404

### Requirement: Numeric collection addresses redirect to the handle
Opening `/users/<id>` or `/users/<id>/shows` as a page SHALL answer a permanent redirect (301) to `/u/<handle>` or `/u/<handle>/shows` for that user, keeping any query string. The page's own background requests to those addresses SHALL be answered as before, without a redirect.

#### Scenario: Old movies link
- **WHEN** a visitor opens `/users/1` and user 1's handle is `todd-seller`
- **THEN** the response is a 301 to `/u/todd-seller`

#### Scenario: Old shows link with a query
- **WHEN** a visitor opens `/users/1/shows?letter=h`
- **THEN** the response is a 301 to `/u/todd-seller/shows?letter=h`

#### Scenario: Background request
- **WHEN** the collection page's Clear button requests `/users/1` in the background
- **THEN** it gets the collection as before, with no redirect

### Requirement: An old handle redirects to the current one
When an owner changes their handle, the old one SHALL stay theirs: opening `/u/<old handle>` or `/u/<old handle>/shows` SHALL answer a 301 to the same page under their current handle, and no other user SHALL be able to take the old handle. Changing back to an old handle SHALL be allowed.

#### Scenario: Shared link after a change
- **WHEN** the owner of `todd-seller` changes their handle to `todd` and a visitor opens `/u/todd-seller/shows`
- **THEN** the response is a 301 to `/u/todd/shows`

#### Scenario: Someone else tries the old handle
- **WHEN** another user tries to save the handle `todd-seller`
- **THEN** it isn't saved, and Account Settings shows its refusal message

#### Scenario: Changing back
- **WHEN** the owner of `todd` changes their handle back to `todd-seller`
- **THEN** it is saved, and `/u/todd` redirects to `/u/todd-seller`

### Requirement: Links to a collection use its handle
Every link that leads to a collection SHALL use its handle's address: where signing in goes, the home page's list of collections, the menu's Movies and TV Shows, and the Movies or TV Shows button on another user's collection. Switching between movies and TV shows SHALL still replace the page's collection without a page load.

#### Scenario: Home page
- **WHEN** a visitor views the home page
- **THEN** each listed collection links to `/u/<its handle>`

#### Scenario: Menu
- **WHEN** a signed-in user with the handle `todd-seller` opens the menu
- **THEN** Movies links to `/u/todd-seller` and TV Shows to `/u/todd-seller/shows`

### Requirement: Owners change their handle in Account Settings
Account Settings SHALL show the handle in a field labelled "Handle:", with the collection's address shown next to it. Saving SHALL store a changed handle when it follows the handle rules and no other user has it, now or as an old handle; otherwise nothing SHALL be saved and the dialog SHALL show its refusal message, which SHALL name what a handle may contain alongside the other fields it already names. A handle typed with capitals SHALL be stored lowercase.

#### Scenario: Changing the handle
- **WHEN** a user changes their handle to `todd` in Account Settings and presses Update
- **THEN** the handle is saved and their collection is at `/u/todd`

#### Scenario: Against the rules
- **WHEN** a user enters `-todd` or `to` and presses Update
- **THEN** nothing is saved, and the dialog's refusal message says a handle is 3 to 30 lowercase letters, digits or hyphens, starting and ending with a letter or digit

#### Scenario: Capitals
- **WHEN** a user enters `Todd` and presses Update
- **THEN** the handle is saved as `todd`

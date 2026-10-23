# Proposal

## Why

API tokens for `/api/v2` (the React app at myflix.stream) and `/api/v3` (the dormant iOS app) never expire, and the secret that signs them was exposed on 2026-10-23, so anyone holding it can mint a working token for any user until it is rotated. The Plex webhook accepts any request whose payload names the Plex account, so anyone can add shows and movies to a collection. The live React app also renders show titles as HTML, so a title containing a script runs for every viewer and can read the stored token. Rotating the secret is the only way to revoke the tokens already issued, and it signs every user out, so it should happen once, together with expiry and with a React app that handles being signed out.

## What Changes

- **BREAKING** `JWT_SECRET` is rotated on the production server. Every existing v2 and v3 token stops working; each user logs in once again.
- API tokens carry an expiry: 30 days when the user ticks "Remember me" at login, 1 day otherwise and for tokens issued at signup. An expired token gets a 401, as an invalid one does today.
- Token verification also checks the issuer, which the code asks for but does not enforce today.
- The Plex webhook requires a secret token in its URL, compared against a new `PLEX_WEBHOOK_SECRET` setting. Requests without the right token are rejected with a 401, and with the setting missing every request is rejected. The owner updates the webhook URL in Plex once.
- The React app (myflix, a separate repository) signs the user out on any 401: it clears the stored login and goes to the login page, instead of failing silently while showing the user as signed in.
- The React app renders show titles as text, decoding HTML entities such as `&amp;` without injecting markup.
- The myflix work starts from GitHub `master`, which holds the 2023 restructure and Dependabot pins the live copy lacks, and carries over the live-only production API URL. It is deployed as today, by copying the files to the server and rebuilding the image; moving myflix to `git pull` deploys is a later change.
- Deploy order: myflix first, then MMDb with the new secrets, then the Plex webhook URL.

Out of scope: server-side logout (`/deauthenticate` keeps clearing only the cookie session, so a token stays valid until it expires), moving the React token out of `localStorage`, and CI for myflix.

## Capabilities

### New Capabilities
- `api-auth`: how the JSON APIs issue and verify login tokens: lifetime, expiry, issuer and signature checks, and the response to a missing, invalid or expired token.
- `plex-webhook`: what the Plex webhook accepts and rejects, and how it authenticates Plex.
- `myflix-client-security`: the React client's protections for its users: signing out when the API rejects the stored token, and rendering text from the API without executing markup.

### Modified Capabilities
None.

## Impact

- MMDb: `app/models/jwt_auth.rb` (expiry, issuer check), the `/authenticate` and `/signup` routes in `app/controllers/api_v2_controller.rb` and `api_v3_controller.rb` (pass the lifetime), `app/controllers/webhooks_controller.rb` (secret check), `spec/spec_helper.rb` (test value for `PLEX_WEBHOOK_SECRET`), new specs for tokens and the webhook, `.env.example`.
- myflix (`~/Development/Myflix Projects/myflix`, GitHub `toddseller/Myflix`): `frontend/client/src/apis/mmdb.js` (production URL, 401 interceptor), `frontend/client/src/components/ShowPreview/index.js` (title as text), new Jest tests; the local repo gains an `origin` remote for GitHub.
- Production: new `JWT_SECRET` and `PLEX_WEBHOOK_SECRET` in `~/MMDb/.env`, generated on the server and never printed; a rebuilt `myflix-nginx` image; the Plex webhook URL updated in Plex settings.
- Users: everyone using the React app or the iOS app is signed out once at deploy, and after that when their token expires.

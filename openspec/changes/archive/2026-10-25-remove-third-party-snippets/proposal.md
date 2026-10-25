# Proposal

## Why

Every page loads two third-party snippets from `app/views/layout.erb`, and one of them breaks the site. Optimizely (`cdn.optimizely.com/js/7859721234.js`) runs an old "MMDb - Dark Mode" experiment: about half of visitors, kept in place by its `optimizelyEndUserId` cookie, get `<link href="/css/dark.css">` appended to the page. That is the unversioned address, still cached at Cloudflare with the old theme files, so those visitors see stale dark styles layered over their theme. On 2026-10-25 it put the sign-in dialog's Remember me box 20px out of line in the light theme for 5 of 10 fresh visitors, and clearing the browser cache can't fix it because the cookie decides. Google Tag Manager (`GTM-T343TNN`) loads Google Analytics' `analytics.js`. Neither belongs to MMDb, and both run someone else's code on every page.

## What Changes

- Remove the Optimizely script tag from `layout.erb`.
- Remove both Google Tag Manager blocks from `layout.erb`: the script in `<head>` and the `<noscript>` iframe in `<body>`. Google Analytics, which Tag Manager loads, goes with it.
- Pages load scripts only from MMDb itself. Cloudflare's Web Analytics beacon stays: Cloudflare adds it at its edge, not in the code, and it is kept by choice.
- For visitors who were in Optimizely's dark variation and use the light theme, the page becomes fully light again; nothing else looks different.

Out of scope: Cloudflare's beacon (kept); the poster images from Apple and TMDB, the S3 fallback image and the Synology links, which are MMDb's own content; the stale `/css/dark.css` at Cloudflare's edge, which nothing requests once Optimizely is gone.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `page-assets`: pages load scripts only from MMDb, with no third-party snippets.

## Impact

- `app/views/layout.erb`: three blocks removed (Tag Manager script, Optimizely script, Tag Manager no-script iframe).
- `spec/`: a layout check that no page carries a script or frame from another site.
- `e2e/smoke.spec.js`: its check that the page requests Tag Manager becomes a check that the page requests no host but the app.
- No data, settings or dependencies change. Google Analytics stops receiving page views; Optimizely stops bucketing and logging visitors.

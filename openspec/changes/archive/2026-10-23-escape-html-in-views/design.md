# Design

## Context

See proposal.md for why and specs/web-page-escaping for the required behavior. Found while planning:

- Views render through Tilt 2.7's plain ERB (`require 'tilt/erb'` in `config/environment.rb`), which has no escaping option. `erubi` is not in the bundle; Tilt registers `Tilt::ErubiTemplate` for `.erb` and passes its options straight to `Erubi::Engine`, which supports `escape:` (escape `<%= %>`, raw `<%== %>`) and `escapefunc:` (the method the generated code calls).
- 301 outputs in 32 view files. Raw HTML is intended in 17 of them: the layout's `<%= yield %>` and 16 embedded `<%= erb :'/partials/...' %>` calls. No output contains a markup string literal; no output sits inside a `<script>` block.
- 87 outputs are unquoted attribute values (`alt=`, `src=`, `value=`, `id=`, `action=`, `href=`), 72 are quoted.
- Production data: HTML entities appear in 1 show title and 1,689 show, season, episode and movie plots; markup characters in 1 episode title. Some importers already decode entities (`HTMLEntities.new.decode` in `show.rb`); the `htmlentities` gem is installed.
- `public/js/mmdb.js` only inserts server-rendered `response.page` HTML, so server-side escaping covers the XHR fragments.

## Goals / Non-Goals

**Goals:**
- Safe by default: a new `<%= %>` is escaped without anyone remembering to.
- Every page looks the same for normal data, entities included.

**Non-Goals:**
- Changing stored data (entities stay; they are decoded at display).
- Escaping in the JSON APIs or the React app (already done there).
- Testing the external-API preview partials with real API responses (the later parser change); they get escaping by default and the view check.

## Decisions

**1. Erubi with escaping on, configured once.** Add `erubi` to the Gemfile and, in `config.ru`'s `configure` block next to `set :views`, `set :erb, escape: true, escapefunc: '::ViewText.escape'`. Apply first checks that `Tilt[:erb]` resolves to `Tilt::ErubiTemplate`; if the explicit `require 'tilt/erb'` keeps the old engine, replace it with `require 'tilt/erubi'`. *Alternative:* an `h()` helper wrapped around each of ~280 outputs. Rejected: every future output would depend on someone remembering it.

**2. `ViewText.escape` decodes entities, then escapes.** `Rack::Utils.escape_html(HTMLEntities.new.decode(value.to_s))`, in `app/helpers/view_text.rb` (already loaded at boot). Decoding first keeps `&amp;` in the 1,689 plots showing as `&` instead of `&amp;`; escaping afterwards turns any decoded `<` back into text. `to_s` covers ids, numbers and `nil`. *Alternative:* a one-time migration that decodes stored entities. Rejected: it changes production data, and importers that don't decode would keep adding entities.

**3. Raw output only for `yield` and partials.** Those 17 become `<%== %>`. Everything else stays `<%= %>` and is escaped.

**4. Every attribute output is double-quoted.** The 87 unquoted ones change from `alt=<%= ... %>` to `alt="<%= ... %>"`. Erubi's escaping turns `"` into `&quot;`, so a quoted value can't end its attribute.

**5. A view check keeps it that way.** `spec/views_spec.rb` scans `app/views/**/*.erb` and fails, naming file and line, when an output follows `=` without a quote, or when a `<%==` holds anything but `yield` or an `erb :'/partials/...'` call.

**6. Page specs before and after.** A characterization spec renders the main pages for normal data (titles with `&`, plots with `&amp;`) and records the visible text; it passes before the change and must pass unchanged after, proving nothing looks different. Hostile-input specs then fail before and pass after. Pages covered: the shows page, a user's movies page, movie info and show info (XHR), the movie edit form, and the shows grid after adding episodes (XHR).

## Risks / Trade-offs

- [A view relied on raw output for something other than a partial] → the characterization spec and the view check catch it; the inventory found none.
- [Double escaping where a value is already escaped, such as `CGI.escape`d links] → URL-encoded text contains no HTML-special characters except `&` in query strings, which `escape_html` turns into `&amp;`, which is correct HTML.
- [Text that literally contains an entity, such as a plot about `&amp;`] → it shows as `&`; acceptable.
- [The engine switch changes whitespace or trim behavior] → the characterization spec compares visible text, and the deploy is followed by a look at the main pages in a browser.

## Migration Plan

Merge, then deploy with `git pull --ff-only && docker compose up -d --build` (new gem). Check the shows page, a movies page and an info view in a browser. Rollback: revert the merge commit and redeploy the same way.

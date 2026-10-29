# Proposal

## Why

Dependabot's json 3 PR (#471) fails CI: every API request with a JSON body gets a 400. `Rack::JSONBodyParser` from rack-contrib 2.5.0, the newest release, parses with `JSON.parse(body, create_additions: false)`, and json 3 removed that option, so the parse raises and the middleware answers "Failed to parse body as JSON". MyFlix's sign-in, signup and every write through `/api/v2` and `/api/v3` would break in production. rack-contrib's issue #201 ("JSON v3 support") is still open, so the fix has to come from this app for json 3's fixes to reach production.

## What Changes

- `config.ru` gives `Rack::JSONBodyParser` its own parser block that calls `JSON.parse(body)` with no options. On json 2 and json 3 alike, `JSON.parse` never builds Ruby objects from the JSON by default, so this keeps today's behavior.
- Nothing else changes: the same verbs and content type are parsed, and a malformed body still gets the middleware's 400.
- Once merged, Dependabot's #471 is rebased and should pass as is.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The APIs read JSON bodies exactly as they do now; this keeps that working on json 3. The change sets `skip_specs: true`.

## Impact

- Code: one line in `config.ru`.
- Dependencies: none added. Unblocks json 3.1.0 (#471).
- Clients: MyFlix and the iOS app see no difference.

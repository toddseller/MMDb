# Design

## Context

`config.ru:44` adds `Rack::JSONBodyParser` with no arguments, so it uses rack-contrib's `DEFAULT_PARSER`, which passes `create_additions: false` to `JSON.parse`. The middleware's `initialize` takes an optional block and uses it in place of `DEFAULT_PARSER`; the block runs in the same `rescue StandardError` that turns a failed parse into the 400. The specs already send JSON bodies through `config.ru` (`spec/support/request.rb`'s `json:`), and about 30 of them fail on #471's branch.

## Goals / Non-Goals

**Goals:**
- JSON request bodies parse the same way on json 2.21 (today) and json 3.1 (#471).

**Non-Goals:**
- Taking json 3 in this change. #471 stays Dependabot's PR and is rebased after this merges.
- Replacing rack-contrib or the middleware.

## Decisions

- **Pass a block with `JSON.parse(body)`.** `create_additions` has defaulted to false for `JSON.parse` since json 2.0, and json 3 has no additions in `parse` at all, so dropping the option changes nothing on either version. Alternatives: pin json below 3 with an ignore rule (leaves json 3's fixes out of production until rack-contrib ships a fix, with no date), or vendor a patched middleware (more code to own than one block).
- **Write the block with `do ... end`.** `use Rack::JSONBodyParser { ... }` would bind the braces to the constant expression rather than `use`, so the block would never reach the middleware.
- **No new spec.** The existing API specs are the regression test: they fail on json 3 today and will run on json 3 once #471 merges. The failing run for test-first comes from those specs with json 3.1.0 locked locally, which is then reverted so this change ships on json 2.

## Risks / Trade-offs

- [rack-contrib later changes how the block is called] → The API specs that send JSON bodies would fail in CI on that Dependabot PR.
- [A malformed body still has to get a 400] → The block runs inside the same rescue, so it does. No spec covers this today (the webhook's `{not json` case is sent as multipart, which skips the middleware), so one example sends a malformed `application/json` body to `/api/v2/authenticate` and expects 400. It passes before and after; it guards the parser being replaced.

## Migration Plan

Merge and deploy as usual; `bin/deploy` only restarts since no Gemfile or Dockerfile changes. Then comment `@dependabot rebase` on #471. Rollback is reverting the one line.

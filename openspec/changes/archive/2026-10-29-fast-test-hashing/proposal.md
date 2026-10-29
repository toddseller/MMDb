# Proposal

## Why

Test users are hashed with bcrypt at its production cost of 12, which is deliberately slow: 191 ms per hash on the development Mac. Most request specs create a user and sign in, so they pay it twice, and the browser tests' seed hashes three users on every reseed and every sign-in verifies against them. Run with bcrypt's minimum cost, the RSpec suite drops from 88 s to 23 s with the same 390 examples passing; one reseed drops from 1.7 s to about 0.8 s.

## What Changes

- `spec/support/test_env.rb`, which both the RSpec suite and the browser tests' server and seed load before the app, sets bcrypt to its minimum cost.
- A spec checks that the app loaded without the test settings, as production loads it, still hashes at bcrypt's default cost.
- No app code changes. Each stored hash carries its own cost, so existing passwords verify exactly as before.
- Not in this change: splitting CI into parallel jobs (a separate change).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ci-test-gate`: adds that tests hash passwords at bcrypt's minimum cost while the app outside tests keeps the default.

## Impact

- `spec/support/test_env.rb` (one setting), a new spec in `spec/password_rules_spec.rb`.
- Faster local and CI runs of RSpec and the browser tests; no production behavior changes.

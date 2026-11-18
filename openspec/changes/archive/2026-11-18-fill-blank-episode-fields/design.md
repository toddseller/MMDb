# Design

## Context

Seven call sites in four controllers add an episode the same way: `season.episodes.find_by(tv_episode: ...) || season.episodes.new(attrs)`, then `save`, then `season.episodes << episode` unless it is already there. `shows_controller.rb` then reads `@episode` and `@season.episodes.count`. The Plex import in `Show` already uses `find_or_initialize_by` plus `assign_attributes`, which overwrites every field; it stays as it is (see proposal.md, What Changes).

The incoming attributes are Sinatra params (indifferent hashes) with `show_id` and `season_id` already removed. They carry `title`, `date`, `plot`, `runtime`, `tv_episode` and sometimes `preview`.

## Goals / Non-Goals

**Goals:**
- One helper that every non-Plex call site uses, so the fill-blanks rule lives in one place and is tested once.

**Non-Goals:**
- Changing the Plex import or its overwrite rule.
- Backfilling episodes that are already blank; they fill in the next time they are added.
- Changing what the endpoints return or how they report failures.

## Decisions

**A `Season#add_episode(attrs)` method that returns the episode.** It finds or builds the episode by `tv_episode`, copies each incoming value that is present only where the stored one is `blank?`, saves, and returns the episode. Callers that check the save use `episode.persisted?` or ignore the result, as most do today. *Alternative:* a class method on `Episode`; rejected because the season is what every caller already holds, and `season.episodes` scoping prevents matching an episode from another season.

**One loop covers new and stored episodes.** A new episode has every field blank, so "copy where blank" fills all of it. No separate create branch is needed.

**Drop the `season.episodes << episode` lines.** `season.episodes.find_or_initialize_by` already sets `season_id`, so the append only ever ran on an episode that was already in the season.

**Unknown keys still raise.** `season.episodes.new(attrs)` raises on an attribute that isn't a column today; the helper keeps that behaviour rather than filtering keys, so a malformed payload fails the same way as before.

**A runtime of `0 min` counts as blank.** `Episode#create_duration` runs on every new record, so an episode saved without a runtime is stored as `0 min`, never blank. Without this rule the missing runtimes this change is for would never be filled. *Alternative:* also stop `create_duration` writing `0 min`; rejected as extra scope, since the rule already covers both stored and future episodes. Formatting needs nothing extra: a filled-in `42` is a bare number, so `create_duration` turns it into `42 min`, and a stored `1h 5m` is kept because it is not blank.

## Risks / Trade-offs

- [A field cleared on purpose by hand gets refilled on the next add] → Accepted: blank is treated as missing. Writing a space doesn't help, because `blank?` counts whitespace too.
- [Hand and API adds now differ from Plex imports] → The new requirement says explicitly that Plex is not covered, and the `plex-webhook` spec keeps its overwrite requirement.

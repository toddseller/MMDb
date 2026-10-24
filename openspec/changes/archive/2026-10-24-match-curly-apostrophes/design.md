# Design

## Context

`Show.get_series` compares names in three places, each with `downcase` and `==`: the Apple merge and the TMDB merge (on `:collectionName`), and `from_stored_source?` (on `:title`, against shows in the database). Apple uses ’ in some titles where TMDB uses '.

## Goals / Non-Goals

**Goals:**
- One name comparison, used in all three places, that ignores case and apostrophe style.

**Non-Goals:**
- Other punctuation or accents (for example "Arsène" against "Arsene", or "&" against "and").
- Changing displayed or stored names, or how the search term matches Apple titles.

## Decisions

**A `same_name?(a, b)` helper next to `same_year?`.** It downcases both names and maps ’ and ‘ to ' with `tr`, then compares. All three comparisons call it, so they can't drift apart. Building a normalized key once per entry was the other option. It saves nothing at these list sizes and adds a field to every row.

**Only the two curly single quotes.** That's the case we've actually seen. Broader normalization (Unicode folding, stripping punctuation) would also merge names that really differ, and nothing has asked for it.

## Risks / Trade-offs

- [Two genuinely different shows whose names differ only in apostrophe style and whose years are within one would merge] → Unlikely. Apple's entry wins, as it does for any other same-name match.

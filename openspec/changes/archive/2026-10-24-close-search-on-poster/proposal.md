# Proposal

## Why

Opening a poster's details leaves the search panel open, for the add search and for the edit form's search. The edit search's results still point at the movie they were searched for, so after opening another poster, picking a result updates a movie that is no longer on screen. The panel has never closed on a poster click, under jQuery or since.

## What Changes

- Opening a poster's details closes the search panel the same way the dismiss control does, for both searches. Closing the open drawer by clicking its poster again leaves the panel alone.
- `drawer.js` imports `close` from `preview.js`, which already cancels a search still in flight. `close` skips the add button when there is none, since a visitor's page has the panel but no add button.
- Browser tests first: opening a poster closes the add search's results, and the edit search's results.

## Capabilities

### Modified Capabilities

- `adding-to-collection`: opening a poster closes the panel like dismissing it.

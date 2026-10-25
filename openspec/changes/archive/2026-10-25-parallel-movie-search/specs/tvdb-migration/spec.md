# Spec Delta

## REMOVED Requirements

### Requirement: A show's TVDB id comes from its seasons
**Reason**: The migration tool is removed with all TVDB code. The migration ran on 2026-10-24; the 4 shows left on TVDB seasons (NOVA, P90, The Bellflower Bunnies, The Truth About Vaccines) were added by hand and get no new episodes, so nothing is left to migrate.
**Migration**: None. Those shows keep their stored seasons and episodes unchanged. Opening one of their seasons to add episodes lists none, and Plex reports for them import nothing.

### Requirement: Every season of a show comes from one source
**Reason**: Removed with the migration tool; see the first removed requirement.
**Migration**: None. Seasons added from search come from Apple or TMDB only, under the show search rules.

### Requirement: Only ids and episode routing change
**Reason**: Removed with the migration tool; see the first removed requirement.
**Migration**: None.

### Requirement: Shows that can't be resolved are reported and left unchanged
**Reason**: Removed with the migration tool; see the first removed requirement.
**Migration**: None. The shows the last run left unresolved stay as they are, on purpose.

### Requirement: A plan never creates duplicate ids
**Reason**: Removed with the migration tool; see the first removed requirement.
**Migration**: None.

### Requirement: The dry run writes a reviewable plan and no data
**Reason**: Removed with the migration tool; see the first removed requirement.
**Migration**: None.

### Requirement: Apply makes exactly the reviewed plan's changes
**Reason**: Removed with the migration tool; see the first removed requirement.
**Migration**: None. A plan file from an earlier dry run can no longer be applied.

# Spec Delta

## Purpose

Repairs movies whose producer field holds a copy of their rating, by looking each one up again in the source its poster came from. Every change goes through a report that a person reviews before it is applied.

## ADDED Requirements

### Requirement: The repair covers movies whose producer is their rating
The dry run SHALL cover every movie whose producer equals its rating, where the rating is not blank, and no other movie.

#### Scenario: Rating copied into producer
- **WHEN** Hook has rating `PG` and producer `PG`
- **THEN** the dry run covers Hook

#### Scenario: Real producers
- **WHEN** American Beauty has rating `R` and producer `Stan Wlodkowski, Bruce Cohen, Dan Jinks, Steven Spielberg`
- **THEN** the dry run leaves American Beauty out

### Requirement: Producers come from the poster's source
A movie whose poster is on an `mzstatic.com` host SHALL be looked up on Apple first. A movie whose poster is on `image.tmdb.org` or `www.themoviedb.org` SHALL be looked up on TMDB first. Any other movie SHALL be looked up on TMDB first.

#### Scenario: Apple poster
- **WHEN** a movie's poster is `https://is3-ssl.mzstatic.com/image/thumb/Video49/v4/cd/9f/2b/cd9f2b36-8bd9-60ac-5733-e64b5fef9a9d/pr_source.lsr/2000x3000.jpg`
- **THEN** its producers are looked up on Apple first

#### Scenario: Uploaded artwork
- **WHEN** a movie's poster is on `cdn.myflix.stream`
- **THEN** its producers are looked up on TMDB first

### Requirement: Matching goes from the exact artwork to title, year and director
For each movie the dry run SHALL take the first of these that finds it:
1. A result in the first source whose artwork is the movie's own poster.
2. A result in the first source with the same title, a year at most one apart, and the same director.
3. A result in the other source with the same title, a year at most one apart, and the same director.

#### Scenario: Apple replaced the cover
- **WHEN** Bruce Almighty (2003, Tom Shadyac) has an old Apple cover that no Apple result uses any more, and Apple returns Bruce Almighty (2003) directed by Tom Shadyac
- **THEN** the movie is matched by title, year and director on Apple

#### Scenario: Not on Apple at all
- **WHEN** Metropia (2010) has an Apple poster, no Apple store returns it, and TMDB returns Metropia (2010) with the same director
- **THEN** the movie is matched on TMDB by title, year and director

### Requirement: Artwork is compared without host or size
Artwork SHALL be compared without the image host or size: an Apple cover by its path after `/image/thumb/` without the final size part, and a TMDB poster by its file name. For TMDB, artwork SHALL also match a poster that is no longer the result's main one but is still among its posters.

#### Scenario: Same Apple cover
- **WHEN** a movie's poster is on `is1-ssl.mzstatic.com` at `2000x3000.jpg` and an Apple result's cover has the same path on `is4-ssl.mzstatic.com` at `600x900.jpg`
- **THEN** the movie is matched by artwork

#### Scenario: An older TMDB poster
- **WHEN** a movie's TMDB poster is no longer the main poster of the TMDB result for the same title and year, but is among that result's posters
- **THEN** the movie is matched by artwork

### Requirement: Apple is searched in the US store first
An Apple lookup SHALL search the US store first. It SHALL search the UK, Canada and Australia stores, one at a time and in that order, only while every store searched so far has failed or returned no movie that matches.

#### Scenario: Found in the US
- **WHEN** the US store returns a result with the movie's cover
- **THEN** no other Apple store is searched for that movie

#### Scenario: Missing from the US store
- **WHEN** the US store returns no matching movie and the UK store returns one
- **THEN** the Canada and Australia stores are not searched for that movie

### Requirement: The new producers are the source's producers
A matched movie's new producers SHALL be the matched result's producers as the app stores them when adding a movie: up to the first six, in the source's order, joined by `, `. A match that lists no producers SHALL give an empty producer.

#### Scenario: Many producers
- **WHEN** the matched TMDB result lists eight producers
- **THEN** the new producer is the first six, joined by `, `

### Requirement: An Apple match by title, year and director brings Apple's current cover
When a movie is matched on Apple by title, year and director, its new poster SHALL be the matched result's current cover, as the app stores a cover when adding a movie: the cover URL at the cover's full width and height as a `.jpg`. A movie matched by artwork, matched on TMDB, unmatched or failed SHALL get no new poster, and its poster SHALL stay as it is.

#### Scenario: Apple replaced the cover
- **WHEN** Bruce Almighty is matched on Apple by title, year and director, and Apple's cover is 1400x2100
- **THEN** its new poster is Apple's cover URL ending `1400x2100.jpg`

#### Scenario: Same cover
- **WHEN** Layer Cake is matched on Apple by artwork
- **THEN** it gets no new poster

#### Scenario: Matched on TMDB
- **WHEN** Metropia has an Apple poster and is matched on TMDB
- **THEN** it gets no new poster

### Requirement: Unmatched movies are cleared and failed lookups are not
A movie that no step matches SHALL get an empty producer. A movie whose lookup failed, because a request errored or timed out or a source answered with an error other than Apple's rate limit, SHALL be reported as failed with no new producer, and the apply step SHALL leave it unchanged.

#### Scenario: Unmatched
- **WHEN** neither source returns a movie that matches by artwork or by title, year and director
- **THEN** the report gives the movie an empty new producer

#### Scenario: TMDB is down
- **WHEN** TMDB answers a movie's search with status 503
- **THEN** the report marks the movie as failed, and applying the report leaves its producer as it is

### Requirement: Apple's rate limit gets one wait, then stops the run
When Apple answers a request with status 429, the dry run SHALL wait five minutes and repeat the request once. An answered repeat SHALL count as that request's answer, so the limit alone never marks a movie failed. If the repeat is also answered 429, the dry run SHALL stop: it SHALL keep the report of the movies it finished, write the cover page for them, leave the movie it was looking up out of the report, and say that Apple's limit stopped it and how many movies it reached.

#### Scenario: A brief limit
- **WHEN** Apple answers a movie's product request with 429, and five minutes later with the product
- **THEN** the movie is matched as if the first answer had been the product

#### Scenario: A limit that lasts
- **WHEN** Apple answers 429 to a request and to its repeat while the dry run looks up its 431st movie
- **THEN** the run stops with 430 rows in the report and a cover page for them, and says Apple's limit stopped it after 430 movies

### Requirement: The dry run logs failures and progress as they happen
The dry run SHALL log each failed movie's id, title and reason when it fails, and SHALL write its progress lines to the log as it prints them, so a long run can be followed.

#### Scenario: A failure
- **WHEN** TMDB answers Hook's search with 503
- **THEN** the log gains a line naming Hook's id, its title and the 503 straight away

### Requirement: The dry run writes a report and changes nothing
The dry run SHALL write a CSV report with one row per covered movie: id, title, year, poster source, how it was matched (`artwork`, `title_year_director`, `other_source`, `unmatched` or `failed`), the old and new producer, and the old and new poster. The new poster SHALL be blank when the poster is not to change. It SHALL NOT change the database.

#### Scenario: Report only
- **WHEN** the dry run finishes for 4,201 movies
- **THEN** the report has 4,201 rows and every movie's producer and poster are unchanged

### Requirement: The dry run writes a page of changed covers to review
Beside the CSV report, the dry run SHALL write an HTML page listing every movie with a new poster: its id, title and year, and its old and new covers shown side by side as images. The page SHALL need nothing but a browser to open.

#### Scenario: Reviewing covers
- **WHEN** the dry run gives Bruce Almighty and Creed new posters
- **THEN** the page shows both, each with its old cover beside its new one, and no movie without a new poster

### Requirement: The apply step writes the reviewed report and nothing else
The apply step SHALL read a report and set each row's producer to the row's new producer, and its poster to the row's new poster when that is not blank. Rows a person edited SHALL be written as edited and rows a person deleted SHALL NOT be written. It SHALL skip rows marked `failed`. It SHALL make no network requests and SHALL NOT change any field but producer and poster.

#### Scenario: Reviewed row
- **WHEN** the report gives Hook the new producer `Kathleen Kennedy, Frank Marshall, Gerald R. Molen`
- **THEN** applying it sets Hook's producer to that, and its title, rating and other fields are unchanged

#### Scenario: Cover kept by the reviewer
- **WHEN** the reviewer blanks Creed's new poster in the CSV
- **THEN** applying it writes Creed's new producer and leaves its poster as it is

#### Scenario: No network
- **WHEN** the report is applied with every network request blocked
- **THEN** every row that should be written is written

### Requirement: The apply step skips movies changed since the dry run
The apply step SHALL write a row only while the movie's producer still equals both its rating and the row's old producer, and its poster still equals the row's old poster. It SHALL leave any other row's movie unchanged and list it as skipped.

#### Scenario: Fixed by hand in the meantime
- **WHEN** a movie's producer was edited by hand after the dry run
- **THEN** applying the report leaves that movie unchanged and lists it as skipped

#### Scenario: Cover changed by hand in the meantime
- **WHEN** a movie's poster was changed by hand after the dry run
- **THEN** applying the report leaves that movie unchanged and lists it as skipped

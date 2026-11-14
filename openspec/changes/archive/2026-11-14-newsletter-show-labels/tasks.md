# Tasks

## 1. Show labels and season links

- [x] 1.1 Test first, then change the label rule in `group.ts` to "New series", else "New season", else "N episodes" / "1 episode", and give each show group the rating key its card links to (the show for a new series, else the season added whole, else the newest episode's season); verify tests cover each label, the season-plus-episodes case, and each link target
- [x] 1.2 Test first, then build show links in `cards.ts` from the group's link key while TMDB artwork still comes from the show; verify a season card links to `/library/metadata/<season key>` and uses the show's poster

## 2. Cards and hero

- [x] 2.1 Test first, then end every tile in a bar joined under its poster: the label in the accent colour for shows, "▶ Play" in the theme's playBar colour for movies, and a grey placeholder image for a title without a poster; verify tests pin the corners and both bar colours, and screenshots at desktop and phone widths show every row's bars on one line
- [x] 2.2 Test first, then pick the hero at random from the titles with a backdrop; verify tests cover a movie hero, a show hero, no hero without backdrops, and the hero leaving its grid

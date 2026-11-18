module PlexLibrary
  MOVIES = 1
  SHOWS = 2
  # A whole-library listing takes several seconds, longer than the web app's per-request limit.
  TIMEOUT = 60

  def self.tautulli(cmd, params = {})
    response = HTTParty.get('https://plex.toddseller.dev/api/v2', query: { apikey: ENV['TAUTULLI_KEY'], cmd: cmd, **params }, timeout: TIMEOUT)
    data = response.code == 200 && response.parsed_response.is_a?(Hash) && response.parsed_response.dig('response', 'data')
    raise "Tautulli #{cmd} failed with HTTP #{response.code}" unless data

    data
  end

  def self.library(section) = tautulli('get_library_media_info', section_id: section, length: 100_000)['data']

  def self.label(title, year) = "#{title} (#{year.presence || '?'})"

  # Fetches both libraries before writing, so a failed request links nothing.
  def self.link(user)
    movies, shows = library(MOVIES), library(SHOWS)
    left, = link_rows(movies, user.movies) { |row, item| Match.same_year?(row.year, item['year']) }
    left, across = link_rows(left, user.movies) { true }
    across.each { |item, row| puts "Linked across years: Plex #{label(item['title'], item['year'])} to MMDb #{label(row.title, row.year)}" }
    left += link_rows(shows, user.shows) { |row, item| Match.same_year?(row.year, item['year']) }.first
    left.each { |item| puts "Not linked: #{label(item['title'], item['year'])}" }
  end

  # shortcut: reads the newest 100 only (a week held 56 episodes on 2026-11-18); page with `start` if weeks outgrow it.
  def self.recent(section)
    # The newest few minutes are left to the webhook, so the two don't both create the same movie.
    window = 7.days.ago.to_i..10.minutes.ago.to_i
    tautulli('get_recently_added', section_id: section, count: 100)['recently_added'].select { |item| window.cover?(item['added_at'].to_i) }
  end

  def self.agrees?(movie, item) = Match.same_name?(movie.title.to_s, item['title'].to_s) && Match.same_year?(movie.year, item['year'])

  # Fetches both lists before writing, so a failed request changes nothing.
  def self.sync(user)
    movies, episodes = recent(MOVIES), recent(SHOWS)
    movies.each { |item| sync_movie(user, item) }
    episodes.select { |item| item['media_type'] == 'episode' }.each { |item| sync_episode(user, item) }
  end

  def self.episode?(user, item)
    show = user.shows.find_by(plex_key: item['grandparent_rating_key'].to_i)
    # A show the backfill couldn't link is found by name, so it isn't imported again every hour.
    show ||= user.shows.where(plex_key: nil).select { |named| Match.same_name?(named.title.to_s, item['grandparent_title'].to_s) }.then { |named| named.first if named.one? }
    season = show&.seasons&.find_by(season: item['parent_media_index'].to_i)
    season.present? && season.episodes.exists?(tv_episode: item['media_index'].to_i)
  end

  def self.sync_episode(user, item)
    return if episode?(user, item)

    guids = tautulli('get_metadata', rating_key: item['rating_key'])['guids'] || []
    Show.plex_add({ 'type' => 'episode', 'grandparentTitle' => item['grandparent_title'], 'grandparentRatingKey' => item['grandparent_rating_key'],
                    'parentIndex' => item['parent_media_index'].to_i, 'index' => item['media_index'].to_i, 'title' => item['title'],
                    'year' => item['year'], 'Guid' => guids.map { |guid| { 'id' => guid } } }, user.id)
    name = "#{item['grandparent_title']} S#{item['parent_media_index']}E#{item['media_index']}"
    puts episode?(user, item) ? "Added episode: #{name}" : "Still missing: #{name}"
  end

  def self.sync_movie(user, item)
    linked = user.movies.find_by(plex_key: item['rating_key'].to_i)
    return if linked && agrees?(linked, item)

    collection = user.movie_ids
    movie = Movie.plex_add({ 'title' => item['title'], 'year' => item['year'], 'ratingKey' => item['rating_key'] }, user.id)
    return unless movie&.persisted? && agrees?(movie, item)

    puts "Added movie: #{label(movie.title, movie.year)}" unless collection.include?(movie.id)
    return unless linked

    # One transaction, so a crash between steps can't leave the old movie owned by nobody.
    Movie.transaction do
      linked.users.destroy(user)
      if linked.users.exists?
        linked.update_column(:plex_key, nil)
        puts "Removed movie: #{label(linked.title, linked.year)}"
      else
        linked.destroy
        puts "Deleted movie: #{label(linked.title, linked.year)}"
      end
    end
  end

  # Links each Plex item to an unlinked row of the same name that the block accepts, when each is the other's only
  # candidate. Returns the items left unlinked and the [item, row] pairs it linked.
  def self.link_rows(items, rows)
    linked = rows.where.not(plex_key: nil).pluck(:plex_key).to_set
    items = items.reject { |item| linked.include?(item['rating_key'].to_i) }
    unlinked = rows.where(plex_key: nil).to_a
    candidates = items.to_h { |item| [item, unlinked.select { |row| Match.same_name?(row.title.to_s, item['title'].to_s) && yield(row, item) }] }
    claims = candidates.values.flatten.tally
    pairs = items.filter_map { |item| [item, candidates[item].first] if candidates[item].one? && claims[candidates[item].first] == 1 }
    pairs.each { |item, row| row.update_column(:plex_key, item['rating_key'].to_i) }
    [items - pairs.map(&:first), pairs]
  end
end

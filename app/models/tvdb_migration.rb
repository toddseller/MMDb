# Moves shows and seasons stored with TVDB ids onto Apple or TMDB ids. `plan` asks the sources and
# returns every change without writing; `apply` makes a reviewed plan's changes without asking again,
# because Apple's show lookup sometimes answers empty for a show it knows.
class TvdbMigration
  SEASON_FIELDS = %w[collectionId appleTvId skip count storeId].freeze

  def self.plan
    shows, orphans = tvdb_shows
    lookups = Show.in_parallel(shows, limit: 6) { |show| lookup(show) }
    plan = { 'shows' => [], 'unresolved' => [], 'orphans' => orphans }
    shows.zip(lookups).each do |show, found|
      result = found ? route(show, found) : { 'reason' => 'a lookup failed; run the plan again' }
      entry = { 'id' => show['id'], 'title' => show['title'] }
      result['reason'] ? plan['unresolved'] << entry.merge(result) : plan['shows'] << entry.merge(result)
    end
    collisions = collisions(plan)
    raise Collision, collisions.join("\n") if collisions.any?
    plan
  end

  def self.cli(argv, out = $stdout)
    command, path = argv
    unless %w[plan apply].include?(command) && path
      out.puts 'usage: bin/migrate-tvdb plan <file> | apply <file>'
      return 2
    end
    command == 'plan' ? write_plan(path, out) : out.puts("applied #{apply(JSON.parse(File.read(path)))} changes from #{path}")
    0
  rescue Collision, Stale => error
    out.puts error.message
    1
  end

  def self.write_plan(path, out)
    plan = plan()
    File.write(path, JSON.pretty_generate(plan))
    routes = plan['shows'].map { |show| show['route'] }.tally.map { |route, count| "#{count} to #{route}" }.join(', ')
    changes = plan['shows'].sum { |show| show['changes'].size }
    out.puts "#{plan['shows'].size} #{plan['shows'].size == 1 ? 'show' : 'shows'} to change (#{routes}), #{changes} rows"
    out.puts "#{plan['unresolved'].size} unresolved, left unchanged:"
    plan['unresolved'].each { |show| out.puts "  #{show['title']} (show #{show['id']}): #{show['reason']}" }
    out.puts "#{plan['orphans'].size} TVDB seasons whose show no longer exists" if plan['orphans'].any?
    out.puts "plan written to #{path}"
  end

  class Collision < StandardError; end
  class Stale < StandardError; end

  # update_columns skips the save callbacks, which would recompute search and season fields this migration doesn't own.
  def self.apply(plan)
    changes = plan['shows'].flat_map { |show| show['changes'] }
    rows = { 'shows' => Show, 'seasons' => Season }.to_h do |table, model|
      [table, model.where(id: changes.filter_map { |change| change['id'] if change['table'] == table }).index_by(&:id)]
    end
    stale = changes.reject do |change|
      row = rows[change['table']][change['id']]
      row && change['fields'].all? { |field, values| row[field] == values['from'] }
    end
    raise Stale, "changed since the plan: #{stale.map { |change| "#{change['table'].delete_suffix('s')} #{change['id']}" }.join(', ')}" if stale.any?
    ActiveRecord::Base.transaction do
      changes.each { |change| rows[change['table']][change['id']].update_columns(change['fields'].transform_values { |values| values['to'] }) }
    end
    changes.size
  end

  # Adding a season finds the show by show_collection_id and the season by collectionId, so two rows sharing one would merge.
  def self.collisions(plan)
    titles = plan['shows'].to_h { |show| [show['id'], show['title']] }
    planned = Hash.new { |hash, key| hash[key] = [] }
    plan['shows'].each do |show|
      show['changes'].each do |change|
        field = change['table'] == 'shows' ? 'show_collection_id' : 'collectionId'
        planned[[field, change['fields'][field]['to']]] << [change['table'], change['id']] if change['fields'][field]
      end
    end
    planned_rows = planned.values.flatten(1)
    Show.where(show_collection_id: planned.keys.filter_map { |field, value| value if field == 'show_collection_id' }).each do |show|
      planned[['show_collection_id', show.show_collection_id]] |= [['shows', show.id]] unless planned_rows.include?(['shows', show.id])
      titles[show.id] = show.title
    end
    Season.where(collectionId: planned.keys.filter_map { |field, value| value if field == 'collectionId' }).each do |season|
      planned[['collectionId', season.collectionId]] |= [['seasons', season.id]] unless planned_rows.include?(['seasons', season.id])
    end
    planned.select { |_, rows| rows.size > 1 }.map do |(field, value), rows|
      names = rows.map { |table, id| table == 'shows' ? "show #{id} (#{titles[id]})" : "season #{id}" }
      "#{field} #{value}: #{names.join(', ')}"
    end
  end

  def self.route(show, found)
    id = show['show_collection_id']
    stored = show['seasons'].map { |season| season['season'] }
    if found['apple'] && (stored - found['apple'].keys).empty?
      changes = show['seasons'].select { |season| tvdb?(season) }.map { |season| season_change(season, apple_fields(found['apple'][season['season']])) }
      return { 'route' => 'apple', 'changes' => changes.compact }
    end
    return { 'reason' => 'no TVDB id in its seasons' } unless show['tvdb']
    ids = found['tmdb_ids']
    return { 'reason' => "TMDB has no show for TVDB id #{show['tvdb']}" } if ids.empty?
    return { 'reason' => "TMDB has #{ids.size} shows for TVDB id #{show['tvdb']}" } if ids.size > 1
    tmdb = ids.first
    return { 'reason' => "show id #{id} is not its TVDB, TMDB or Apple id" } unless apple?(id) || [show['tvdb'], tmdb].include?(id)
    missing = stored - found['tmdb_seasons']
    return { 'reason' => "TMDB lacks seasons #{missing.join(', ')}" } if missing.any?
    show_change = { 'table' => 'shows', 'id' => show['id'], 'fields' => { 'show_collection_id' => { 'from' => id, 'to' => tmdb } } } unless id == tmdb
    season_changes = show['seasons'].map { |season| season_change(season, tmdb_fields(tmdb, season['season'])) }
    { 'route' => 'tmdb', 'changes' => [show_change, *season_changes].compact }
  end

  def self.tmdb_fields(tmdb, number) = { 'collectionId' => "tmdb#{tmdb}#{number}", 'appleTvId' => nil, 'skip' => nil, 'storeId' => nil }

  def self.apple_fields(row)
    { 'collectionId' => row[:collectionId], 'appleTvId' => row[:appleTvId], 'skip' => row[:skip].to_s, 'count' => row[:count].to_s, 'storeId' => row[:storeId] }
  end

  # Blank and nil both mean "not set", so clearing an empty field isn't a change.
  def self.season_change(season, fields)
    changed = fields.reject { |field, value| season[field].presence == value.presence }
    return if changed.empty?
    { 'table' => 'seasons', 'id' => season['id'], 'fields' => changed.to_h { |field, value| [field, { 'from' => season[field], 'to' => value }] } }
  end

  def self.tvdb?(season) = season['collectionId'].to_s.start_with?('tvdb')

  def self.apple?(id) = id.to_s.start_with?('umc.')

  # Read everything up front: the lookups run on other threads and must not touch ActiveRecord.
  def self.tvdb_shows
    tvdb_seasons = Season.where("\"collectionId\" LIKE 'tvdb%'")
    shows = Show.where(id: tvdb_seasons.select(:show_id)).includes(:seasons).map do |show|
      seasons = show.seasons.map { |season| season.attributes.slice('id', 'season', *SEASON_FIELDS) }
      { 'id' => show.id, 'title' => show.title, 'show_collection_id' => show.show_collection_id, 'seasons' => seasons, 'tvdb' => tvdb_id(seasons) }
    end
    orphans = tvdb_seasons.where.not(show_id: Show.select(:id)).map { |season| { 'season_id' => season.id, 'collectionId' => season.collectionId } }
    [shows, orphans]
  end

  # A TVDB season's collection id is "tvdb" + TVDB id + season number; a season whose id doesn't end in its own number was stored wrong.
  def self.tvdb_id(seasons)
    ids = seasons.filter_map do |season|
      rest = season['collectionId'].to_s.delete_prefix('tvdb')
      rest.delete_suffix(season['season'].to_s) if tvdb?(season) && rest.end_with?(season['season'].to_s)
    end
    ids.tally.max_by(&:last)&.first
  end

  # Raising marks the show as a failed lookup: in_parallel turns the error into nil.
  def self.lookup(show)
    found = {}
    if apple?(show['show_collection_id'])
      found['apple'] = apple_seasons(show)
      return found if (show['seasons'].map { |season| season['season'] } - found['apple'].keys).empty?
    end
    return found unless show['tvdb']
    results = Show.tmdb_request("https://api.themoviedb.org/3/find/#{show['tvdb']}?external_source=tvdb_id")[:body]['tv_results']
    raise "TMDB find gave no results list for #{show['tvdb']}" unless results
    found['tmdb_ids'] = results.map { |result| result['id'].to_s }
    return found unless results.size == 1
    details = Show.tmdb_request("https://api.themoviedb.org/3/tv/#{results[0]['id']}")[:body]
    found.merge('tmdb_seasons' => details.fetch('seasons').map { |season| season['season_number'] })
  end

  # The stored storefront first, then Apple's usual order, until one returns the show's seasons.
  def self.apple_seasons(show)
    stores = ([show['seasons'].filter_map { |season| season['storeId'] }.first] + Show::APPLE_STORES).compact.uniq
    stores.each do |store|
      rows = Show.appletv_show(show['show_collection_id'], store)
      return rows.to_h { |row| [row[:season].to_i, row] } if rows.any?
    end
    {}
  end
end

module AppleTv
  STORES = ['143441', '143444', '143455', '143460']
  PARAMS = '&locale=en-US&utsk=0&caller=wta&v=58&pfm=appletv'
  BASE = 'https://uts-api.itunes.apple.com/uts/v2/'
  # Seconds before an Apple, TMDB or Tautulli request gives up; answers normally take under one, and callers fall back on failure.
  TIMEOUT = 5

  # The [id, store] pairs to fetch for a search: items of one type whose title contains the term, best matches first.
  def self.matches(s_term, type, limit)
    term = s_term.downcase
    hits = InParallel.map(STORES) { |store| search(store, s_term).select { |item| item['type'] == type && item['title'] }.map { |item| [item['id'], item['title'], store] } }.compact.flatten(1)
    # Storefronts are searched in priority order, so the first store seen for an item is the one to fetch it from.
    found = hits.each_with_object({}) { |(id, title, store), first| first[id] ||= [title, store] }
    contained = found.select { |_, (title, _)| title.downcase.include?(term) }.to_a
    ranked = contained.each_with_index.sort_by { |((_, (title, _)), index)| [rank(title.downcase, term), index] }.map(&:first)
    ranked.first(limit).map { |id, (_, store)| [id, store] }
  end

  def self.rank(title, term)
    return 0 if title == term
    title.start_with?(term) ? 1 : 2
  end

  def self.search(store, s_term)
    response = HTTParty.get(BASE + 'search/incremental?sf=' + store + PARAMS + '&q=' + CGI.escape(s_term), timeout: TIMEOUT)
    return [] unless response.code == 200 && response['data'] && response['data']['canvas']
    response['data']['canvas']['shelves'].flat_map { |shelf| shelf['items'] || [] }
  end

  def self.view(path, store)
    HTTParty.get(BASE + 'view/' + path + '?sf=' + store + PARAMS, timeout: TIMEOUT)
  end
end

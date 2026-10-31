describe 'page assets' do
  def asset_urls
    page = Nokogiri::HTML(get('/', xhr: false).body)
    (page.css('script[src^="/js/"]').map { |s| s['src'] } + page.css('link[href^="/css/"]').map { |l| l['href'] })
  end

  def version_of(file, urls = asset_urls) = urls.find { |url| url.start_with?(file) }[/\?v=(\w+)\z/, 1]

  STYLESHEETS = %w[normalize bootstrap.min palette layout typography navigation modals movies drawer dialog responsive].freeze

  it 'gives every script and stylesheet a version' do
    urls = asset_urls

    expect(urls.size).to eq 1 + STYLESHEETS.size
    expect(urls).to all(match(%r{\A/(js|css)/[\w.-]+\?v=\d+\z}))
  end

  it 'links every stylesheet in cascade order' do
    stylesheets = asset_urls.grep(%r{\A/css/}).map { |url| url[%r{\A/css/(.+)\.css\?}, 1] }

    expect(stylesheets).to eq STYLESHEETS
  end

  it 'changes only the changed stylesheet\'s version' do
    path = APP_ROOT.join('public', 'css', 'movies.css')
    original = File.mtime(path)
    before = asset_urls
    File.utime(original, original + 60, path)

    after = asset_urls
    expect(after.grep(%r{\A/css/movies\.css})).not_to eq before.grep(%r{\A/css/movies\.css})
    expect(after.grep_v(%r{\A/css/movies\.css})).to eq before.grep_v(%r{\A/css/movies\.css})
  ensure
    File.utime(original, original, path)
  end

  it 'keeps the version while the file is unchanged' do
    expect(version_of('/js/main.js')).to eq version_of('/js/main.js')
  end

  it 'changes the version when the file changes' do
    path = APP_ROOT.join('public', 'js', 'main.js')
    original = File.mtime(path)
    before = version_of('/js/main.js')
    File.utime(original, original + 60, path)

    expect(version_of('/js/main.js')).not_to eq before
  ensure
    File.utime(original, original, path)
  end

  # An imported stylesheet can't get a version from its file, so it would be served stale after a deploy.
  it 'imports no stylesheet' do
    expect(Dir[APP_ROOT.join('public', 'css', '*.css')].select { |path| File.read(path).include?('@import') }).to be_empty
  end

  it 'serves a versioned import as the same file' do
    plain = get('/css/modals.css', xhr: false)
    versioned = get('/css/modals.css?v=2', xhr: false)

    expect(versioned.status).to eq 200
    expect(versioned.body).to eq plain.body
  end

  # Posters load natively now; the plugin's scroll handler also made content-visibility freeze long scrolls.
  it 'loads no script-based lazy loader' do
    expect(asset_urls.grep(/lazyload/)).to be_empty
  end

  def import_map(page = Nokogiri::HTML(get('/', xhr: false).body))
    JSON.parse(page.at_css('script[type="importmap"]').text)['imports']
  end

  it 'maps every script module to its versioned URL' do
    modules = Dir[APP_ROOT.join('public', 'js', 'mmdb', '*.js')].map { |path| File.basename(path) }.sort

    expect(modules).not_to be_empty
    expect(import_map.keys).to eq modules.map { |name| "#mmdb/#{name}" }
    import_map.each do |specifier, url|
      expect(url).to match(%r{\A/js/mmdb/#{Regexp.escape(specifier.delete_prefix('#mmdb/'))}\?v=\d+\z})
    end
  end

  it 'changes only the changed module\'s version' do
    path = APP_ROOT.join('public', 'js', 'mmdb', 'events.js')
    original = File.mtime(path)
    before = import_map
    File.utime(original, original + 60, path)

    after = import_map
    expect(after['#mmdb/events.js']).not_to eq before['#mmdb/events.js']
    expect(after.except('#mmdb/events.js')).to eq before.except('#mmdb/events.js')
  ensure
    File.utime(original, original, path)
  end

  it 'loads main.js as a versioned module after the import map' do
    page = Nokogiri::HTML(get('/', xhr: false).body)
    scripts = page.css('script')
    map_index = scripts.index { |script| script['type'] == 'importmap' }
    main_index = scripts.index { |script| script['type'] == 'module' && script['src'].to_s.start_with?('/js/main.js?v=') }

    expect(map_index).not_to be_nil
    expect(main_index).not_to be_nil
    expect(main_index).to be > map_index
  end
end

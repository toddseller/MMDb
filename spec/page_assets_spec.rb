describe 'page assets' do
  def asset_urls
    page = Nokogiri::HTML(get('/', xhr: false).body)
    (page.css('script[src^="/js/"]').map { |s| s['src'] } + page.css('link[href^="/css/"]').map { |l| l['href'] })
  end

  def version_of(file, urls = asset_urls) = urls.find { |url| url.start_with?(file) }[/\?v=(\w+)\z/, 1]

  it 'gives every script and the stylesheet a version' do
    urls = asset_urls

    expect(urls.size).to eq 4
    expect(urls).to all(match(%r{\A/(js|css)/[\w.-]+\?v=\w+\z}))
  end

  it 'keeps the version while the file is unchanged' do
    expect(version_of('/js/mmdb.js')).to eq version_of('/js/mmdb.js')
  end

  it 'changes the version when the file changes' do
    path = APP_ROOT.join('public', 'js', 'mmdb.js')
    original = File.mtime(path)
    before = version_of('/js/mmdb.js')
    File.utime(original, original + 60, path)

    expect(version_of('/js/mmdb.js')).not_to eq before
  ensure
    File.utime(original, original, path)
  end

  %w[dark default].each do |theme|
    it "imports the #{theme} theme's modals.css with a version" do
      expect(File.read(APP_ROOT.join('public', 'css', "#{theme}.css"))).to match(%r{@import url\('themes/#{theme}/modals\.css\?v=\d+'\);})
    end
  end

  it 'serves a versioned import as the same file' do
    plain = get('/css/themes/dark/modals.css', xhr: false)
    versioned = get('/css/themes/dark/modals.css?v=2', xhr: false)

    expect(versioned.status).to eq 200
    expect(versioned.body).to eq plain.body
  end

  # Posters load natively now; the plugin's scroll handler also made content-visibility freeze long scrolls.
  it 'loads no script-based lazy loader' do
    expect(asset_urls.grep(/lazyload/)).to be_empty
    %w[mmdb.js application.js].each do |script|
      expect(File.read(APP_ROOT.join('public', 'js', script))).not_to include('.lazyload(')
    end
  end
end

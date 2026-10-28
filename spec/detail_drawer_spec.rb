# The drawer's motion can only be seen in a browser, so these check the structure the motion depends on.
describe 'detail drawer' do
  def css(path) = File.read(APP_ROOT.join('public', 'css', path))

  # Every block whose selector list includes the selector, including blocks inside @media.
  def rules(path, selector)
    css(path).gsub(%r{/\*.*?\*/}m, '').scan(/([^{}]+)\{([^{}]*)\}/).filter_map do |selectors, body|
      body if selectors.split(',').map { |each| each.gsub(/\s+/, ' ').strip }.include?(selector)
    end
  end

  def rule(path, selector) = rules(path, selector).join("\n")

  context 'drawer.css' do
    it 'lays both lists out as a grid with a gap' do
      %w[#movie-list #show-list].each do |list|
        expect(rule('drawer.css', list)).to include('display: grid').and include('gap:')
      end
    end

    it 'spans the drawer across the row and animates its rows, not a max-height' do
      expect(rule('drawer.css', '.info')).to include('grid-column: 1 / -1', 'grid-template-rows: 0fr').and match(/transition:[^;]*grid-template-rows/)
      expect(rule('drawer.css', '.info.open')).to include('grid-template-rows: 1fr')
      expect(css('drawer.css')).not_to include('max-height')
    end

    # Above the poster, the pointer escapes the poster's shadow and shows as a lighter diamond.
    it 'keeps the pointer under the open poster and its shadow' do
      z_index = ->(selector) { rule('drawer.css', selector)[/z-index: (\d+)/, 1].to_i }

      expect(z_index.call('.pointer')).to be_between(1, z_index.call('.index-preview.open img') - 1)
    end

    # Rendering every one of thousands of movie tiles each frame is what made the drawer stutter.
    it 'lets the browser skip off-screen movie tiles, except the open one' do
      expect(rule('drawer.css', '#movie-list > .index-preview')).to include('content-visibility: auto', 'contain-intrinsic-size: 174px 303px')
      expect(rule('drawer.css', '#movie-list > .index-preview.open')).to include('content-visibility: visible')
    end

    it 'turns the motion off for reduced motion' do
      expect(css('drawer.css')).to include('@media (prefers-reduced-motion: reduce)')
    end

    # A poster with no height until it loads pushed the details down when it arrived.
    it "holds the drawer posters' shape before they load, with the placeholder fitted the same way" do
      movie = rule('drawer.css', '#meta-data .description-poster img')
      expect(movie).to include('display: block', 'aspect-ratio: 2 / 3', 'object-fit: contain', 'background-size: contain', 'background-position: center', 'background-repeat: no-repeat')
      expect(rule('drawer.css', '#info-header > .description-poster img')).to include('aspect-ratio: 1')
    end

    # The movie selector matches the show's poster too, so the show rule only wins by coming later.
    it 'puts the show poster rule after the movie one' do
      expect(css('drawer.css').index('#info-header > .description-poster img')).to be > css('drawer.css').index('#meta-data .description-poster img')
    end
  end

  context 'movies.css' do
    it 'leaves drawer sizing and motion to drawer.css' do
      expect(rule('movies.css', '.info')).not_to match(/max-height|margin|transition|height|width/)
      expect(rules('movies.css', '.info.active')).to be_empty
      expect(rules('movies.css', '.notransition')).to be_empty
      expect(css('movies.css')).not_to match(/nth-child\(\dn\)/)
    end

    # A layer per image meant thousands of GPU layers to move each frame on the movies page.
    it 'puts no transform on every image' do
      expect(rule('movies.css', 'img')).not_to match(/transform/)
    end

    # A set height or background: none would undo the drawer's square box and its placeholder colour.
    it "leaves the show poster's shape to drawer.css and gives both posters a theme colour to load over" do
      expect(rule('movies.css', '#info-header > .description-poster img')).not_to match(/height|background: none/)
      expect(rule('movies.css', '#info-header > .description-poster img')).to match(/background-color: var\(--[\w-]+\)/)
      expect(rule('modals.css', '#meta-data .description-poster img')).to match(/background-color: var\(--[\w-]+\)/)
    end
  end

  %w[default dark].each do |theme|
    it "has the #{theme} theme import drawer.css and movies.css with versions" do
      expect(css("#{theme}.css")).to match(%r{@import url\('drawer\.css\?v=\d+'\);}).and match(%r{@import url\('movies\.css\?v=\d+'\);})
    end
  end
end

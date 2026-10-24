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
  end

  %w[default dark].each do |theme|
    context "#{theme} theme" do
      let(:path) { "themes/#{theme}/movies.css" }

      it 'leaves drawer sizing and motion to drawer.css' do
        expect(rule(path, '.info')).not_to match(/max-height|margin|transition|height|width/)
        expect(rules(path, '.info.active')).to be_empty
        expect(rules(path, '.notransition')).to be_empty
        expect(css(path)).not_to match(/nth-child\(\dn\)/)
      end

      # A layer per image meant thousands of GPU layers to move each frame on the movies page.
      it 'puts no transform on every image' do
        expect(rule(path, 'img')).not_to match(/transform/)
      end

      it 'imports the versions that carry the rendering changes' do
        expect(css("#{theme}.css")).to include("@import url('themes/#{theme}/movies.css?v=3');", "@import url('drawer.css?v=3');")
      end

      it 'imports drawer.css and the changed movies.css with versions' do
        expect(css("#{theme}.css")).to match(%r{@import url\('drawer\.css\?v=\d+'\);}).and match(%r{@import url\('themes/#{theme}/movies\.css\?v=\d+'\);})
      end
    end
  end

  context 'mmdb.js' do
    let(:script) { File.read(APP_ROOT.join('public', 'js', 'mmdb.js')) }

    it 'no longer rewrites tile margins or tracks the open tile by hand' do
      expect(script).not_to match(/var (filtered|filteredWithInfo|switchInfoDiv) = function/)
    end

    it 'finds the row from the layout, not from a fixed count per row' do
      expect(script).not_to match(/itemsPerRow|% ?7\b|\? 7 : 6/)
    end

    it 'removes the drawer when its transition ends, not on a timer' do
      expect(script).not_to match(/setTimeout\(\w*[Rr]emove\w*/)
    end
  end
end

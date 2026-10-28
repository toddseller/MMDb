# Two full copies of each theme stylesheet drifted apart, so a fix reached one theme only. These keep one copy.
describe 'themes' do
  def css(path) = File.read(APP_ROOT.join('public', 'css', path))
  def imports(entry) = css(entry).scan(/@import url\('([^']+)'\);/).flatten

  it 'keeps no per-theme copies' do
    expect(APP_ROOT.join('public', 'css', 'themes')).not_to exist
  end

  it 'holds each theme colour once, light and dark side by side' do
    palette = css('palette.css').gsub(%r{/\*.*?\*/}m, '')

    expect(palette.strip).to match(/\A:root\s*\{[^{}]*\}\z/)
    declarations = palette[/\{([^{}]*)\}/, 1].split(';').map(&:strip).reject(&:empty?)
    expect(declarations).not_to be_empty
    expect(declarations).to all(match(/\A--[\w-]+:\s*light-dark\(.+\)\z/m))
  end

  it 'gives both themes the same versioned stylesheets, differing only in colour scheme' do
    expect(imports('default.css')).to eq imports('dark.css')
    expect(imports('default.css')).to include(match(/\Apalette\.css\?v=\d+\z/), match(/\Alayout\.css\?v=\d+\z/), match(/\Amodals\.css\?v=\d+\z/), match(/\Amovies\.css\?v=\d+\z/))
    expect(css('default.css').gsub(/@import[^;]+;/, '').gsub(/\s+/, '')).to eq ':root{color-scheme:light;}'
    expect(css('dark.css').gsub(/@import[^;]+;/, '').gsub(/\s+/, '')).to eq ':root{color-scheme:dark;}'
  end

  it 'keeps colour pairs in the palette, not in the shared stylesheets' do
    %w[layout.css modals.css movies.css].each do |file|
      expect(css(file)).not_to include('light-dark(')
    end
  end
end

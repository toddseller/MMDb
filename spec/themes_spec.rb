# Two full copies of each theme stylesheet drifted apart, so a fix reached one theme only. These keep one copy.
describe 'themes' do
  def css(path) = File.read(APP_ROOT.join('public', 'css', path))
  def imports(entry) = css(entry).scan(/@import url\('([^']+)'\);/).flatten

  it 'keeps no per-theme copies' do
    expect(APP_ROOT.join('public', 'css', 'themes')).not_to exist
  end

  it 'holds each theme colour once, light and dark side by side' do
    palette = css('palette.css').gsub(%r{/\*.*?\*/}m, '')
    root = palette[/:root\s*\{([^{}]*)\}/, 1]

    declarations = root.split(';').map(&:strip).reject(&:empty?)
    expect(declarations).not_to be_empty
    expect(declarations).to all(match(/\A--[\w-]+:\s*light-dark\(.+\)\z/m))
  end

  # color-scheme picks each light-dark() side; light dark lets the device pick, and follow it live.
  it 'maps each page theme to a colour scheme' do
    palette = css('palette.css').gsub(/\s+/, ' ')

    expect(palette).to include('[data-theme="default"] { color-scheme: light; }', '[data-theme="dark"] { color-scheme: dark; }', '[data-theme="system"] { color-scheme: light dark; }')
  end

  it 'serves every theme from one stylesheet of versioned imports' do
    expect(APP_ROOT.join('public', 'css', 'default.css')).not_to exist
    expect(APP_ROOT.join('public', 'css', 'dark.css')).not_to exist
    expect(imports('app.css')).to include(match(/\Apalette\.css\?v=\d+\z/), match(/\Alayout\.css\?v=\d+\z/), match(/\Amodals\.css\?v=\d+\z/), match(/\Amovies\.css\?v=\d+\z/))
    expect(css('app.css').gsub(/@import[^;]+;/, '').strip).to be_empty
  end

  it 'keeps colour pairs in the palette, not in the shared stylesheets' do
    %w[layout.css modals.css movies.css].each do |file|
      expect(css(file)).not_to include('light-dark(')
    end
  end
end

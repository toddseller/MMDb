describe 'layout' do
  let(:page) { get('/', xhr: false).body }
  let(:html) { Nokogiri::HTML(page) }

  it "loads only the app's own scripts and its import map" do
    foreign = html.css('script').reject { |script| script['type'] == 'importmap' || script['src'].to_s.start_with?('/js/') }

    expect(foreign.map { |script| script.to_html[0, 80] }).to eq []
  end

  it 'has no frames' do
    expect(html.css('iframe').size).to eq 0
  end

  it 'mentions no tag manager, analytics or experiment service' do
    expect(page.scan(/googletagmanager|google-analytics|optimizely/i).uniq).to eq []
  end
end

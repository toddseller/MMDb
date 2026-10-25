describe AppleTv, '.matches' do
  def stub_search(term, store, items)
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?})
      .with(query: hash_including('sf' => store, 'q' => term))
      .to_return(status: 200, body: { data: { canvas: { shelves: [{ items: items }] } } }.to_json, headers: { 'Content-Type' => 'application/json' })
  end

  def movie(id, title) = { type: 'Movie', id: id, title: title }

  before { AppleTv::STORES.each { |store| stub_search('rocky', store, []) } }

  it 'takes each id from the first storefront that returned it' do
    stub_search('rocky', '143444', [movie('uk-only', 'Rocky'), movie('both', 'Rocky II')])
    stub_search('rocky', '143441', [movie('both', 'Rocky II')])

    expect(AppleTv.matches('rocky', 'Movie', 20)).to contain_exactly(['uk-only', '143444'], ['both', '143441'])
  end

  it 'ranks exact titles, then titles starting with the term, then titles containing it, in Apple order within a rank' do
    stub_search('rocky', '143441', [movie('c1', 'The Rocky Horror'), movie('p1', 'Rocky II'), movie('e', 'Rocky'), movie('p2', 'Rocky III')])

    expect(AppleTv.matches('rocky', 'Movie', 20).map(&:first)).to eq %w[e p1 p2 c1]
  end

  it 'keeps the exact match when the cap cuts the list' do
    stub_search('rocky', '143441', (1..14).map { |n| movie("c#{n}", "My Rocky #{n}") } + [movie('e', 'ROCKY')])

    matches = AppleTv.matches('rocky', 'Movie', 10)

    expect(matches.size).to eq 10
    expect(matches.first).to eq ['e', '143441']
  end

  it 'ignores other item types and titles without the term' do
    stub_search('rocky', '143441', [{ type: 'Show', id: 's', title: 'Rocky Road' }, movie('x', 'Creed'), movie('e', 'Rocky')])

    expect(AppleTv.matches('rocky', 'Movie', 20)).to eq [['e', '143441']]
  end
end

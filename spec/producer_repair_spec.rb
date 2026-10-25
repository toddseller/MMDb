require 'csv'
require 'tmpdir'

describe ProducerRepair do
  include MovieSearchStubs

  before do
    stub_movie_sources_empty
    stub_const('ProducerRepair::APPLE_PAUSE', 0)
  end

  def movie(title, rating: 'PG', producer: 'PG', year: '1991', director: 'Steven Spielberg', poster: 'https://image.tmdb.org/t/p/w342/hook.jpg')
    Movie.create!(title: title, year: year, rating: rating, producer: producer, director: director, poster: poster)
  end

  def row_for(movie) = ProducerRepair.plan.find { |row| row[:id] == movie.id }

  HOOK_PRODUCERS = ['Kathleen Kennedy', 'Frank Marshall', 'Gerald R. Molen']

  # results: hashes of id, title, year and poster file name.
  def stub_tmdb_search(title, results)
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/search/movie\?}).with(query: hash_including('query' => title))
      .to_return(json(results: results.map { |r| { id: r[:id], title: r[:title], release_date: "#{r[:year]}-06-01", poster_path: "/#{r[:poster]}" } }))
  end

  def stub_tmdb_credits(id, director: 'Steven Spielberg', producers: HOOK_PRODUCERS)
    crew = [{ name: director, job: 'Director' }] + producers.map { |name| { name: name, job: 'Producer' } }
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/movie/#{id}\?}).to_return(json(credits: { cast: [], crew: crew }))
  end

  APPLE_SEARCH = %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/search/incremental\?}
  US, UK, CANADA, AUSTRALIA = AppleTv::STORES

  def stub_apple_search(title, store: US, ids: [])
    stub_request(:get, APPLE_SEARCH).with(query: hash_including('sf' => store, 'q' => title))
      .to_return(json(data: { canvas: { shelves: [{ items: ids.map { |id| { type: 'Movie', id: id, title: title } } }] } }))
  end

  # cover: the path after /image/thumb/, as Apple serves it with {w}x{h}.{f} for the size.
  def stub_apple_product(id, title: 'Hook', year: 1991, director: 'Steven Spielberg', producers: HOOK_PRODUCERS, cover: 'Video/aa/bb/hook.jpg', host: 'is4-ssl', width: 1400, height: 2100)
    roles = [{ type: 'Director', personName: director }] + producers.map { |name| { type: 'Producer', personName: name } }
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/view/product/#{Regexp.escape(id)}\?}).to_return(json(data: {
      content: { title: title, releaseDate: Time.utc(year, 6, 1).to_i * 1000,
                 images: { coverArt: { url: "https://#{host}.mzstatic.com/image/thumb/#{cover}/{w}x{h}.{f}", width: width, height: height }.compact } },
      roles: roles
    }))
  end

  def apple_searched?(store) = a_request(:get, APPLE_SEARCH).with(query: hash_including('sf' => store))

  def stub_tmdb_images(id, posters)
    stub_request(:get, %r{\Ahttps://api\.themoviedb\.org/3/movie/#{id}/images}).to_return(json(posters: posters.map { |file| { file_path: "/#{file}" } }))
  end

  describe 'which movies it covers' do
    it 'covers a movie whose producer is its rating, and no other' do
      hook = movie('Hook')
      movie('American Beauty', rating: 'R', producer: 'Bruce Cohen, Dan Jinks')
      movie('Mask', rating: 'PG-13', producer: 'PG')
      movie('Unrated Thing', rating: '', producer: '')

      expect(ProducerRepair.plan.map { |row| row[:id] }).to eq [hook.id]
    end
  end

  describe 'which source it asks first' do
    {
      'https://is3-ssl.mzstatic.com/image/thumb/Video49/v4/cd/9f/2b/cd9f/pr_source.lsr/2000x3000.jpg' => 'apple',
      'https://image.tmdb.org/t/p/w342/kWhXubAiIcHW0xn5GThflqaKZqh.jpg' => 'tmdb',
      'https://www.themoviedb.org/t/p/original/cL135d6y3CXwmttM9yb9VHbxwm0.jpg' => 'tmdb',
      'https://cdn.myflix.stream/images/fire-saga.jpg' => 'other'
    }.each do |poster, source|
      it "reports #{source} for a poster on #{URI(poster).host}" do
        expect(row_for(movie('Hook', poster: poster))[:source]).to eq source
      end
    end
  end

  describe 'matching on TMDB' do
    let(:hook) { movie('Hook') }

    it 'matches the search result carrying the poster, by artwork' do
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1991, poster: 'hook.jpg' }])
      stub_tmdb_credits(879)

      expect(row_for(hook)).to include(matched_by: 'artwork', new_producer: HOOK_PRODUCERS.join(', '), new_poster: '')
    end

    it "matches by artwork when the poster is among a same-year result's older posters" do
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1991, poster: 'new-hook.jpg' }])
      stub_tmdb_images(879, ['new-hook.jpg', 'hook.jpg'])
      stub_tmdb_credits(879)

      expect(row_for(hook)).to include(matched_by: 'artwork', new_producer: HOOK_PRODUCERS.join(', '))
    end

    it 'matches the same title, a year apart, with the same director' do
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1992, poster: 'new-hook.jpg' }])
      stub_tmdb_images(879, ['new-hook.jpg'])
      stub_tmdb_credits(879)

      expect(row_for(hook)).to include(matched_by: 'title_year_director', new_producer: HOOK_PRODUCERS.join(', '))
    end

    it 'keeps the first six of eight producers' do
      eight = %w[One Two Three Four Five Six Seven Eight]
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1991, poster: 'hook.jpg' }])
      stub_tmdb_credits(879, producers: eight)

      expect(row_for(hook)[:new_producer]).to eq 'One, Two, Three, Four, Five, Six'
    end

    it 'gives an empty producer for a match that lists none' do
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1991, poster: 'hook.jpg' }])
      stub_tmdb_credits(879, producers: [])

      expect(row_for(hook)).to include(matched_by: 'artwork', new_producer: '')
    end
  end

  describe 'matching on Apple' do
    let(:hook) { movie('Hook', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video/aa/bb/hook.jpg/2000x3000.jpg') }

    it 'matches the same cover on another host and size by artwork, and asks no other store' do
      stub_apple_search('Hook', ids: ['umc.hook'])
      stub_apple_product('umc.hook')

      expect(row_for(hook)).to include(matched_by: 'artwork', new_producer: HOOK_PRODUCERS.join(', '), new_poster: '')
      expect(apple_searched?(UK)).not_to have_been_made
    end

    it "matches title, year and director, and brings Apple's current cover at its own size" do
      stub_apple_search('Hook', ids: ['umc.hook'])
      stub_apple_product('umc.hook', cover: 'Video124/v4/cc/dd/new/pr_source.lsr')

      expect(row_for(hook)).to include(
        matched_by: 'title_year_director', new_producer: HOOK_PRODUCERS.join(', '),
        new_poster: 'https://is4-ssl.mzstatic.com/image/thumb/Video124/v4/cc/dd/new/pr_source.lsr/1400x2100.jpg'
      )
    end

    it 'offers no new cover when Apple gives the cover no size' do
      stub_apple_search('Hook', ids: ['umc.hook'])
      stub_apple_product('umc.hook', cover: 'Video124/v4/cc/dd/new/pr_source.lsr', width: nil)

      expect(row_for(hook)).to include(matched_by: 'title_year_director', new_producer: HOOK_PRODUCERS.join(', '), new_poster: '')
    end

    it 'moves on to the UK store when the US has no match, and stops there' do
      stub_apple_search('Hook', store: UK, ids: ['umc.hook'])
      stub_apple_product('umc.hook')

      expect(row_for(hook)).to include(matched_by: 'artwork')
      expect(apple_searched?(US)).to have_been_made
      expect(apple_searched?(CANADA)).not_to have_been_made
      expect(apple_searched?(AUSTRALIA)).not_to have_been_made
    end

    it 'trims the spaces Apple pads producer names with' do
      stub_apple_search('Hook', ids: ['umc.hook'])
      stub_apple_product('umc.hook', producers: [" Kathleen Kennedy\u00a0", 'Frank Marshall '])

      expect(row_for(hook)[:new_producer]).to eq 'Kathleen Kennedy, Frank Marshall'
    end
  end

  describe 'falling back and failing' do
    let(:apple_hook) { movie('Hook', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video/aa/bb/hook.jpg/2000x3000.jpg') }
    let(:tmdb_hook) { movie('Hook') }
    let(:tmdb_search) { %r{\Ahttps://api\.themoviedb\.org/3/search/movie\?} }

    it 'finds an Apple-poster movie no Apple store has on TMDB, as other_source, with no new poster' do
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1991, poster: 'tmdb-hook.jpg' }])
      stub_tmdb_credits(879)

      expect(row_for(apple_hook)).to include(matched_by: 'other_source', new_producer: HOOK_PRODUCERS.join(', '), new_poster: '')
    end

    it "takes no new poster from an Apple match reached as the other source" do
      other = movie('Hook', poster: 'https://cdn.myflix.stream/images/hook.jpg')
      stub_apple_search('Hook', ids: ['umc.hook'])
      stub_apple_product('umc.hook', cover: 'Video124/v4/new/pr_source.lsr')

      expect(row_for(other)).to include(matched_by: 'other_source', new_producer: HOOK_PRODUCERS.join(', '), new_poster: '')
    end

    it 'clears the producer of a movie neither source matches' do
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1991, poster: 'other.jpg' }])
      stub_tmdb_images(879, ['other.jpg'])
      stub_tmdb_credits(879, director: 'Someone Else')

      expect(row_for(tmdb_hook)).to include(matched_by: 'unmatched', new_producer: '', new_poster: '')
    end

    {
      'a 503' => ->(stub) { stub.to_return(status: 503, body: '{}') },
      'a timeout' => ->(stub) { stub.to_timeout },
      'a refused connection' => ->(stub) { stub.to_raise(Errno::ECONNREFUSED) }
    }.each do |trouble, answer|
      it "marks a movie failed on #{trouble} from its first source, and asks no other" do
        answer.call(stub_request(:get, tmdb_search))

        expect(row_for(tmdb_hook)).to include(matched_by: 'failed', new_producer: '', new_poster: '')
        expect(a_request(:get, APPLE_SEARCH)).not_to have_been_made
      end
    end

    it 'marks an Apple movie failed when a store errors and no other store finds it' do
      stub_request(:get, APPLE_SEARCH).with(query: hash_including('sf' => US)).to_return(status: 503, body: '')

      expect(row_for(apple_hook)).to include(matched_by: 'failed')
      expect(a_request(:get, tmdb_search)).not_to have_been_made
    end

    it 'marks an Apple movie failed when Apple answers with a page that is not JSON' do
      stub_request(:get, APPLE_SEARCH).to_return(status: 200, body: '<html>Busy</html>', headers: { 'Content-Type' => 'text/html' })

      expect(row_for(apple_hook)).to include(matched_by: 'failed')
    end

    it 'skips an Apple search result with no id' do
      stub_request(:get, APPLE_SEARCH).with(query: hash_including('sf' => US))
        .to_return(json(data: { canvas: { shelves: [{ items: [{ type: 'Movie', title: 'Hook' }, { type: 'Movie', id: 'umc.hook', title: 'Hook' }] }] } }))
      stub_apple_product('umc.hook')

      expect(row_for(apple_hook)).to include(matched_by: 'artwork')
    end
  end

  describe 'the report' do
    let(:dir) { Dir.mktmpdir }
    let(:path) { File.join(dir, 'producers.csv') }
    let(:log) { StringIO.new }

    after { FileUtils.remove_entry(dir) }

    it 'writes one row per covered movie under the agreed header, and changes no movie' do
      hook = movie('Hook')
      mask = movie('Mask', rating: 'PG-13', producer: 'PG-13', year: '1985', director: 'Peter Bogdanovich', poster: 'https://image.tmdb.org/t/p/w342/mask.jpg')
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1991, poster: 'hook.jpg' }])
      stub_tmdb_credits(879)

      ProducerRepair.write_plan(path, log: log)

      report = CSV.read(path, headers: true)
      expect(report.headers).to eq %w[id title year source matched_by old_producer new_producer old_poster new_poster]
      expect(report.map { |row| [row['id'].to_i, row['matched_by'], row['new_producer'].to_s] })
        .to eq [[hook.id, 'artwork', HOOK_PRODUCERS.join(', ')], [mask.id, 'unmatched', '']]
      expect([hook, mask].map { |m| m.reload.values_at(:producer, :poster) })
        .to eq [['PG', 'https://image.tmdb.org/t/p/w342/hook.jpg'], ['PG-13', 'https://image.tmdb.org/t/p/w342/mask.jpg']]
    end

    it 'can be limited to some of the covered movies, for a trial run' do
      hook = movie('Hook')
      movie('Mask', rating: 'PG-13', producer: 'PG-13')

      ProducerRepair.write_plan(path, movies: ProducerRepair.affected.where(id: hook.id), log: log)

      expect(CSV.read(path, headers: true).map { |row| row['id'].to_i }).to eq [hook.id]
      expect(log.string).to start_with '1 movies:'
    end

    it 'reports its progress every 100 movies and when it finishes' do
      101.times { |i| movie("Movie #{i}") }

      ProducerRepair.write_plan(path, log: log)

      expect(log.string.lines.map(&:chomp)).to eq ['100 of 101 movies', '101 movies: 0 artwork, 0 title_year_director, 0 other_source, 101 unmatched, 0 failed']
    end

    describe 'the cover page' do
      let(:old_cover) { 'https://is1-ssl.mzstatic.com/image/thumb/Video/aa/bb/hook.jpg/2000x3000.jpg' }

      def page = Nokogiri::HTML(File.read("#{path}.html"))

      before do
        stub_apple_search('Hook', ids: ['umc.hook'])
        stub_apple_product('umc.hook', cover: 'Video124/v4/cc/dd/new/pr_source.lsr')
      end

      it 'shows each movie getting a new cover, old beside new, as grid-sized thumbnails' do
        hook = movie('Hook', poster: old_cover)
        movie('Mask', rating: 'PG-13', producer: 'PG-13', poster: 'https://image.tmdb.org/t/p/w342/mask.jpg')

        ProducerRepair.write_plan(path, log: log)

        rows = page.css('tbody tr')
        expect(rows.map { |row| row.css('td').first(2).map(&:text) }).to eq [[hook.id.to_s, 'Hook (1991)']]
        expect(rows.first.css('img').map { |img| img['src'] }).to eq [
          'https://is1-ssl.mzstatic.com/image/thumb/Video/aa/bb/hook.jpg/348x522bb.jpg',
          'https://is4-ssl.mzstatic.com/image/thumb/Video124/v4/cc/dd/new/pr_source.lsr/348x522bb.jpg'
        ]
        expect(page.css('script')).to be_empty
      end

      it 'escapes markup and quotes in a title or address' do
        stub_apple_search('<script>x</script> "Hook"', ids: ['umc.hook'])
        stub_apple_product('umc.hook', title: '<script>x</script> "Hook"', cover: 'Video124/v4/new" onerror="alert(1)')
        movie('<script>x</script> "Hook"', poster: old_cover)

        ProducerRepair.write_plan(path, log: log)

        expect(page.css('script')).to be_empty
        expect(page.css('img[onerror]')).to be_empty
        expect(page.css('tbody td')[1].text).to eq '<script>x</script> "Hook" (1991)'
      end
    end
  end

  describe 'applying a reviewed report' do
    let(:hook) { movie('Hook') }
    let(:bruce) { movie('Bruce Almighty', rating: 'PG-13', producer: 'PG-13', year: '2003', director: 'Tom Shadyac', poster: 'https://is1-ssl.mzstatic.com/image/thumb/Video/old/bruce.jpg/2000x3000.jpg') }
    let(:new_cover) { 'https://is4-ssl.mzstatic.com/image/thumb/Video124/v4/new/pr_source.lsr/1400x2100.jpg' }

    # As a row reads back from the CSV: every value a string, blanks as nil.
    def report_row(movie, **changes)
      { id: movie.id.to_s, matched_by: 'artwork', old_producer: movie.producer, new_producer: 'Someone', old_poster: movie.poster, new_poster: nil }.merge(changes)
    end

    def state(movie) = movie.reload.attributes.except('id')

    it 'writes the new producer, and the new cover where there is one, and nothing else' do
      before_hook, before_bruce = state(hook), state(bruce)

      result = ProducerRepair.apply([report_row(hook, new_producer: HOOK_PRODUCERS.join(', ')),
                                     report_row(bruce, matched_by: 'title_year_director', new_producer: 'Tom Shadyac', new_poster: new_cover)])

      expect(state(hook)).to eq before_hook.merge('producer' => HOOK_PRODUCERS.join(', '))
      expect(state(bruce)).to eq before_bruce.merge('producer' => 'Tom Shadyac', 'poster' => new_cover)
      expect(result).to eq(written: [hook.id, bruce.id], changed: [], failed: [])
    end

    it 'writes every row or none' do
      allow_any_instance_of(Movie).to receive(:update_columns).and_wrap_original do |original, *args|
        raise 'disk full' if original.receiver.id == bruce.id
        original.call(*args)
      end

      expect { ProducerRepair.apply([report_row(hook), report_row(bruce)]) }.to raise_error('disk full')
      expect(hook.reload.producer).to eq 'PG'
    end

    it 'keeps the current cover when the reviewer blanked the new one' do
      ProducerRepair.apply([report_row(bruce, new_producer: 'Tom Shadyac', new_poster: nil)])

      expect(bruce.reload.values_at(:producer, :poster)).to eq ['Tom Shadyac', 'https://is1-ssl.mzstatic.com/image/thumb/Video/old/bruce.jpg/2000x3000.jpg']
    end

    it 'writes an edited producer as edited, and leaves a deleted row alone' do
      bruce

      ProducerRepair.apply([report_row(hook, new_producer: 'Edited By Hand')])

      expect([hook.reload.producer, bruce.reload.producer]).to eq ['Edited By Hand', 'PG-13']
    end

    it 'skips a movie whose producer or cover changed since the dry run' do
      rows = [report_row(hook), report_row(bruce, new_poster: new_cover)]
      hook.update_columns(producer: 'Fixed By Hand')
      bruce.update_columns(poster: 'https://cdn.myflix.stream/images/bruce.jpg')

      expect(ProducerRepair.apply(rows)).to eq(written: [], changed: [hook.id, bruce.id], failed: [])
      expect([hook.reload.producer, bruce.reload.producer]).to eq ['Fixed By Hand', 'PG-13']
    end

    it 'leaves a failed row alone' do
      expect(ProducerRepair.apply([report_row(hook, matched_by: 'failed', new_producer: nil)])).to eq(written: [], changed: [], failed: [hook.id])
      expect(hook.reload.producer).to eq 'PG'
    end

    it 'needs no network' do
      WebMock.reset!

      expect(ProducerRepair.apply([report_row(hook)])[:written]).to eq [hook.id]
    end

    it 'applies the CSV the dry run wrote, and says what it did' do
      dir = Dir.mktmpdir
      path = File.join(dir, 'producers.csv')
      log = StringIO.new
      stub_tmdb_search('Hook', [{ id: 879, title: 'Hook', year: 1991, poster: 'hook.jpg' }])
      stub_tmdb_credits(879)
      hook
      ProducerRepair.write_plan(path, log: log)

      ProducerRepair.apply_file(path, log: log)

      expect(hook.reload.producer).to eq HOOK_PRODUCERS.join(', ')
      expect(log.string.lines.last.chomp).to eq '1 written, 0 failed, 0 changed since the dry run'
    ensure
      FileUtils.remove_entry(dir)
    end
  end
end

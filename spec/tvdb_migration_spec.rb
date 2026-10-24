describe TvdbMigration do
  include ShowSearchStubs

  def store_show(title, id, seasons)
    show = Show.create!(title: title, year: '2021', show_collection_id: id)
    seasons.each do |number, collection_id, attributes = {}|
      show.seasons.create!({ season: number, collectionName: "#{title}, Season #{number}", collectionId: collection_id, poster: "#{title}-#{number}.jpg" }.merge(attributes))
    end
    show
  end

  def find_url(tvdb) = "https://api.themoviedb.org/3/find/#{tvdb}?external_source=tvdb_id"

  def stub_tmdb_find(tvdb, ids)
    stub_request(:get, find_url(tvdb)).to_return(json(tv_results: ids.map { |id| { id: id } }))
  end

  def stub_tmdb_seasons(id, numbers)
    stub_request(:get, "https://api.themoviedb.org/3/tv/#{id}").to_return(json(id: id, seasons: ([0] + numbers).map { |n| { season_number: n } }))
  end

  context 'finding TVDB shows' do
    it 'takes the TVDB id from the seasons when the show id was already changed' do
      store_show('The Wheel of Time', '71914', [[1, 'tvdb3557301'], [2, 'tvdb3557302'], [3, 'tmdb719143']])
      stub_tmdb_find('355730', [71914])
      stub_tmdb_seasons(71914, [1, 2, 3])

      TvdbMigration.plan

      expect(a_request(:get, find_url('355730'))).to have_been_made.once
    end

    it 'uses the most common TVDB id when one season has a wrong collection id' do
      store_show('The Joy of Painting', '79167', [[1, 'tvdb791671'], [2, 'tvdb791671'], [3, 'tvdb791673'], [4, 'tvdb791674']])
      stub_tmdb_find('79167', [1405])
      stub_tmdb_seasons(1405, [1, 2, 3, 4])

      TvdbMigration.plan

      expect(a_request(:get, find_url('79167'))).to have_been_made.once
    end

    it 'reports TVDB seasons whose show no longer exists' do
      orphan = Season.new(show_id: 999_999, season: 1, collectionId: 'tvdb123451')
      orphan.save!(validate: false)

      expect(TvdbMigration.plan['orphans']).to eq [{ 'season_id' => orphan.id, 'collectionId' => 'tvdb123451' }]
    end
  end

  def apple_seasons(id, numbers) = numbers.map { |n| [n, "#{id}-s#{n}", { appleTvId: id, skip: '0', count: '10', storeId: '143441' }] }

  def stub_apple_unknown(id)
    stub_request(:get, %r{\Ahttps://uts-api\.itunes\.apple\.com/uts/v2/view/show/#{Regexp.escape(id)}[/?]}).to_return(status: 404, body: '{}', headers: ShowSearchStubs::JSON_HEADERS)
  end

  def entry(plan, title) = plan['shows'].find { |show| show['title'] == title }

  def changed_rows(plan, title) = entry(plan, title)['changes'].map { |change| [change['table'], change['id']] }

  def reason(plan, title) = plan['unresolved'].find { |show| show['title'] == title }&.fetch('reason')

  context 'routes' do
    it 'keeps an Apple show on Apple when Apple has every season, converting only the TVDB season' do
      show = store_show('Westworld', 'umc.cmc.ww', apple_seasons('umc.cmc.ww', [1, 2, 3]) + [[4, 'tvdb2967624']])
      stub_apple_show('umc.cmc.ww', title: 'Westworld', seasons: [[1, 10], [2, 10], [3, 8], [4, 8]])

      plan = TvdbMigration.plan

      expect(entry(plan, 'Westworld')['route']).to eq 'apple'
      expect(changed_rows(plan, 'Westworld')).to eq [['seasons', show.seasons.find_by(season: 4).id]]
    end

    it 'moves an Apple show to TMDB when Apple lacks one of its seasons' do
      show = store_show('Fraggle Rock', 'umc.cmc.fr', apple_seasons('umc.cmc.fr', [1, 2, 3, 4]) + [[5, 'tvdb764295']])
      stub_apple_show('umc.cmc.fr', title: 'Fraggle Rock', seasons: [[1, 24], [2, 24], [3, 24], [4, 24]])
      stub_tmdb_find('76429', [2957])
      stub_tmdb_seasons(2957, [1, 2, 3, 4, 5])

      plan = TvdbMigration.plan

      expect(entry(plan, 'Fraggle Rock')['route']).to eq 'tmdb'
      expect(changed_rows(plan, 'Fraggle Rock')).to match_array [['shows', show.id]] + show.seasons.map { |season| ['seasons', season.id] }
    end

    it 'moves an Apple show to TMDB when Apple no longer recognizes it' do
      show = store_show('After Life', 'umc.cmc.al', apple_seasons('umc.cmc.al', [1, 2]) + [[3, 'tvdb3475073']])
      stub_apple_unknown('umc.cmc.al')
      stub_tmdb_find('347507', [79410])
      stub_tmdb_seasons(79410, [1, 2, 3])

      plan = TvdbMigration.plan

      expect(entry(plan, 'After Life')['route']).to eq 'tmdb'
      expect(changed_rows(plan, 'After Life')).to match_array [['shows', show.id]] + show.seasons.map { |season| ['seasons', season.id] }
    end

    it 'moves an all-TVDB show and its seasons to TMDB' do
      show = store_show('Wakefield', '400126', [[1, 'tvdb4001261'], [2, 'tvdb4001262']])
      stub_tmdb_find('400126', [111110])
      stub_tmdb_seasons(111110, [1, 2])

      plan = TvdbMigration.plan

      expect(entry(plan, 'Wakefield')['route']).to eq 'tmdb'
      expect(changed_rows(plan, 'Wakefield')).to match_array [['shows', show.id]] + show.seasons.map { |season| ['seasons', season.id] }
    end

    context 'unresolved' do
      before { store_show('P90', '394192', [[1, 'tvdb3941921'], [2, 'tvdb3941922']]) }

      it 'reports a show TMDB has no match for' do
        stub_tmdb_find('394192', [])

        plan = TvdbMigration.plan

        expect(reason(plan, 'P90')).to eq 'TMDB has no show for TVDB id 394192'
        expect(entry(plan, 'P90')).to be_nil
      end

      it 'reports a show TMDB matches more than once' do
        stub_tmdb_find('394192', [1, 2])

        expect(reason(TvdbMigration.plan, 'P90')).to eq 'TMDB has 2 shows for TVDB id 394192'
      end

      it 'reports a show TMDB lacks a season of' do
        stub_tmdb_find('394192', [5])
        stub_tmdb_seasons(5, [1])

        expect(reason(TvdbMigration.plan, 'P90')).to eq 'TMDB lacks seasons 2'
      end

      it 'reports a failed lookup' do
        stub_request(:get, find_url('394192')).to_timeout

        expect(reason(TvdbMigration.plan, 'P90')).to eq 'a lookup failed; run the plan again'
      end

      it 'reports a show id that is neither its TVDB id, its TMDB id nor an Apple id' do
        store_show('NOVA', '761193', [[1, 'tvdb761921']])
        stub_tmdb_find('394192', [])
        stub_tmdb_find('76192', [3934])
        stub_tmdb_seasons(3934, [1])

        expect(reason(TvdbMigration.plan, 'NOVA')).to eq 'show id 761193 is not its TVDB, TMDB or Apple id'
      end
    end
  end

  context 'fields' do
    def fields(plan, title, season) = entry(plan, title)['changes'].find { |change| change['id'] == season.id }['fields']

    it 'gives a TMDB season its TMDB collection id and clears its Apple routing' do
      show = store_show('Wakefield', '400126', [[1, 'tvdb4001261', { appleTvId: 'umc.cmc.old', skip: '0', storeId: '143441', count: '10' }]])
      stub_tmdb_find('400126', [111110])
      stub_tmdb_seasons(111110, [1])

      plan = TvdbMigration.plan

      expect(fields(plan, 'Wakefield', show.seasons.first)).to eq(
        'collectionId' => { 'from' => 'tvdb4001261', 'to' => 'tmdb1111101' },
        'appleTvId' => { 'from' => 'umc.cmc.old', 'to' => nil },
        'skip' => { 'from' => '0', 'to' => nil },
        'storeId' => { 'from' => '143441', 'to' => nil }
      )
      expect(entry(plan, 'Wakefield')['changes'].find { |change| change['table'] == 'shows' }['fields']).to eq('show_collection_id' => { 'from' => '400126', 'to' => '111110' })
    end

    it 'gives an Apple season Apple’s ids, skip, count and store' do
      show = store_show('Westworld', 'umc.cmc.ww', apple_seasons('umc.cmc.ww', [1]) + [[2, 'tvdb2967622']])
      stub_apple_show('umc.cmc.ww', title: 'Westworld', seasons: [[1, 10], [2, 8]])

      expect(fields(TvdbMigration.plan, 'Westworld', show.seasons.find_by(season: 2))).to eq(
        'collectionId' => { 'from' => 'tvdb2967622', 'to' => 'umc.cmc.ww-s2' },
        'appleTvId' => { 'from' => nil, 'to' => 'umc.cmc.ww' },
        'skip' => { 'from' => nil, 'to' => '10' },
        'count' => { 'from' => nil, 'to' => '8' },
        'storeId' => { 'from' => nil, 'to' => '143441' }
      )
    end

    it 'never plans a change to a title, collection name or poster' do
      store_show('Wakefield', '400126', [[1, 'tvdb4001261'], [2, 'tvdb4001262']])
      stub_tmdb_find('400126', [111110])
      stub_tmdb_seasons(111110, [1, 2])

      planned = entry(TvdbMigration.plan, 'Wakefield')['changes'].flat_map { |change| change['fields'].keys }.uniq

      expect(planned).to match_array %w[show_collection_id collectionId]
    end
  end

  context 'collisions' do
    before do
      store_show('Wakefield', '400126', [[1, 'tvdb4001261']])
      stub_tmdb_find('400126', [111110])
      stub_tmdb_seasons(111110, [1])
    end

    it 'refuses a show id another show already has' do
      store_show('Wakefield (added from TMDB)', '111110', [[2, 'tmdb1111102']])

      expect { TvdbMigration.plan }.to raise_error(TvdbMigration::Collision, /show_collection_id 111110: .*Wakefield.*Wakefield \(added from TMDB\)/)
    end

    it 'refuses a collection id another season already has' do
      store_show('Somewhere Else', 'umc.cmc.else', [[1, 'tmdb1111101']])
      stub_apple_show('umc.cmc.else', title: 'Somewhere Else', seasons: [[1, 5]])

      expect { TvdbMigration.plan }.to raise_error(TvdbMigration::Collision, /collectionId tmdb1111101/)
    end

    it 'refuses two planned rows getting the same id' do
      store_show('Wakefield Again', '500126', [[1, 'tvdb5001261']])
      stub_tmdb_find('500126', [111110])

      expect { TvdbMigration.plan }.to raise_error(TvdbMigration::Collision) { |error|
        expect(error.message).to include('show_collection_id 111110', 'collectionId tmdb1111101')
      }
    end

    it 'writes nothing to the database' do
      writes = queries { TvdbMigration.plan }.grep(/\A\s*(INSERT|UPDATE|DELETE)/i)

      expect(writes).to be_empty
    end
  end

  context 'apply' do
    let!(:wakefield) { store_show('Wakefield', '400126', [[1, 'tvdb4001261', { skip: '0', appleTvId: 'umc.cmc.old' }], [2, 'tvdb4001262']]) }
    let!(:westworld) { store_show('Westworld', 'umc.cmc.ww', apple_seasons('umc.cmc.ww', [1]) + [[2, 'tvdb2967622']]) }

    before do
      stub_tmdb_find('400126', [111110])
      stub_tmdb_seasons(111110, [1, 2])
      stub_apple_show('umc.cmc.ww', title: 'Westworld', seasons: [[1, 10], [2, 8]])
    end

    # The apply step reads the plan back from a file, so give it what JSON gives back.
    def reviewed_plan = JSON.parse(TvdbMigration.plan.to_json)

    it 'makes every planned change, leaving nothing for a second plan' do
      TvdbMigration.apply(reviewed_plan)

      expect(wakefield.reload.show_collection_id).to eq '111110'
      expect(wakefield.seasons.map { |season| [season.collectionId, season.skip, season.appleTvId, season.poster] }).to match_array [
        ['tmdb1111101', nil, nil, 'Wakefield-1.jpg'], ['tmdb1111102', nil, nil, 'Wakefield-2.jpg']
      ]
      expect(westworld.seasons.find_by(season: 2).attributes.slice('collectionId', 'appleTvId', 'skip', 'count')).to eq(
        'collectionId' => 'umc.cmc.ww-s2', 'appleTvId' => 'umc.cmc.ww', 'skip' => '10', 'count' => '8'
      )
      expect(TvdbMigration.plan['shows']).to be_empty
    end

    it 'changes nothing when a planned row was edited after the plan' do
      plan = reviewed_plan
      edited = wakefield.seasons.find_by(season: 2)
      edited.update_columns(collectionId: 'tvdb4001262-edited')

      expect { TvdbMigration.apply(plan) }.to raise_error(TvdbMigration::Stale, /season #{edited.id}/)
      expect(wakefield.reload.show_collection_id).to eq '400126'
      expect(westworld.seasons.find_by(season: 2).collectionId).to eq 'tvdb2967622'
    end

    it 'calls no outside service' do
      plan = reviewed_plan
      WebMock.reset!

      TvdbMigration.apply(plan)

      expect(wakefield.reload.show_collection_id).to eq '111110'
    end
  end

  context 'bin/migrate-tvdb' do
    def script = APP_ROOT.join('bin', 'migrate-tvdb').to_s

    def run_script(*args)
      stub_const('ARGV', args)
      out = StringIO.new
      original, $stdout = $stdout, out
      load script
    rescue SystemExit => exit
      [exit.status, out.string]
    ensure
      $stdout = original
    end

    it 'writes a plan file, then applies it' do
      show = store_show('Wakefield', '400126', [[1, 'tvdb4001261']])
      store_show('P90', '394192', [[1, 'tvdb3941921']])
      stub_tmdb_find('400126', [111110])
      stub_tmdb_seasons(111110, [1])
      stub_tmdb_find('394192', [])
      file = Tempfile.new(['tvdb-plan', '.json'])

      status, out = run_script('plan', file.path)
      expect(status).to eq 0
      expect(out).to include('1 show to change', 'P90', 'TMDB has no show for TVDB id 394192')
      expect(JSON.parse(File.read(file.path))['shows'].map { |entry| entry['title'] }).to eq ['Wakefield']
      expect(show.reload.show_collection_id).to eq '400126'

      status, out = run_script('apply', file.path)
      expect(status).to eq 0
      expect(out).to include('applied 2 changes')
      expect(show.reload.show_collection_id).to eq '111110'
    end

    it 'explains its usage and fails without a command and file' do
      expect(run_script('plan')).to eq [2, "usage: bin/migrate-tvdb plan <file> | apply <file>\n"]
    end

    it 'is executable' do
      expect(File.executable?(script)).to be true
    end
  end
end

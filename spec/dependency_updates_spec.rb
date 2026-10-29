describe 'dependency updates' do
  let(:from) { File.read(APP_ROOT.join('Dockerfile'))[/^FROM (\S+)/, 1] }
  let(:image_ruby) { Gem::Version.new(from[/\Aruby:(\d+\.\d+\.\d+)/, 1]) }

  # Dependabot can only propose a republished image when the Dockerfile names its digest.
  it 'pins the base image by digest' do
    expect(from).to match(/\Aruby:\d+\.\d+\.\d+@sha256:\h{64}\z/)
  end

  # A base image bump to the next Ruby patch must not stop bundle install inside it.
  it "accepts the image's Ruby and the next patch release" do
    requirement = Gem::Requirement.new(*Bundler.definition.ruby_version.versions)
    major, minor, patch = image_ruby.segments
    expect(requirement).to be_satisfied_by(image_ruby)
    expect(requirement).to be_satisfied_by(Gem::Version.new("#{major}.#{minor}.#{patch + 1}"))
  end

  describe 'the Tests workflow' do
    let(:jobs) { YAML.safe_load_file(APP_ROOT.join('.github', 'workflows', 'test.yml'))['jobs'] }
    let(:runs) { ->(job) { jobs[job]['steps'].map { |step| step['run'].to_s } } }

    # The tests run outside Docker, so only building the image catches an update that breaks it.
    it 'builds the image in a job the required check waits for' do
      expect(runs.('image')).to include(start_with('docker build'))
    end

    # The ci-test-gate spec runs tests on production's Postgres major version, now 18 on 192.168.40.5.
    it 'tests against PostgreSQL 18' do
      expect(%w[unit browser].map { |job| jobs[job]['services']['postgres']['image'] }).to all eq 'postgres:18'
    end

    # Browser tests share one seeded database, so they run in parallel only as separate jobs.
    it 'splits the browser tests into shards that each run' do
      shards = jobs['browser']['strategy']['matrix']['shard']
      expect(shards).to eq (1..shards.size).to_a
      expect(jobs['browser']['strategy']['fail-fast']).to be false
      expect(runs.('browser')).to include("npx playwright test --shard=${{ matrix.shard }}/#{shards.size}")
    end

    # The ruleset and deploy.yml wait for "test", and GitHub counts a skipped required job as passed.
    it 'passes the required check only when every job passed' do
      expect(jobs['test']['needs']).to match_array %w[image unit browser]
      expect(jobs['test']['if']).to eq 'always()'
      expect(runs.('test').join).to include('needs.*.result', "'failure'", "'cancelled'", "'skipped'")
    end
  end
end

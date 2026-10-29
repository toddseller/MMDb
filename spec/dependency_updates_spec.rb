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

  # The tests run outside Docker, so only building the image catches an update that breaks it.
  it 'builds the image in the required check' do
    steps = YAML.safe_load_file(APP_ROOT.join('.github', 'workflows', 'test.yml'))['jobs']['test']['steps']
    expect(steps.map { |step| step['run'].to_s }).to include(start_with('docker build'))
  end

  # The ci-test-gate spec runs tests on production's Postgres major version, now 18 on 192.168.40.5.
  it 'tests against PostgreSQL 18' do
    services = YAML.safe_load_file(APP_ROOT.join('.github', 'workflows', 'test.yml'))['jobs']['test']['services']
    expect(services['postgres']['image']).to eq 'postgres:18'
  end
end

require 'open3'
require 'tmpdir'

# Runs bin/deploy against a throwaway origin and server checkout, with docker and curl replaced by
# recorders, so every decision the script makes can be checked without touching a real server.
module DeployHarness
  SCRIPT = APP_ROOT.join('bin', 'deploy')

  attr_reader :root

  def git(dir, *args)
    out, status = Open3.capture2e(isolated_env, 'git', '-C', dir.to_s, *args)
    raise "git #{args.join(' ')} failed: #{out}" unless status.success?
    out.strip
  end

  # Keeps the developer's global git settings (signing, hooks) out of the throwaway repositories.
  def isolated_env
    { 'HOME' => root.to_s, 'GIT_CONFIG_NOSYSTEM' => '1', 'GIT_AUTHOR_NAME' => 'Deploy Test', 'GIT_AUTHOR_EMAIL' => 'deploy@example.test',
      'GIT_COMMITTER_NAME' => 'Deploy Test', 'GIT_COMMITTER_EMAIL' => 'deploy@example.test' }
  end

  def seed = root.join('seed')
  def server = root.join('server')
  def docker_log = root.join('docker.log')
  def curl_log = root.join('curl.log')

  def build_repositories
    @root = Pathname(Dir.mktmpdir('deploy-spec'))
    git(root, 'init', '--quiet', '--bare', '--initial-branch=master', 'origin.git')
    git(root, 'clone', '--quiet', root.join('origin.git').to_s, 'seed')
    FileUtils.mkdir_p(seed.join('bin'))
    FileUtils.cp(SCRIPT, seed.join('bin', 'deploy'), preserve: true)
    commit('app.rb' => "puts 'v1'\n", 'Gemfile.lock' => "GEM\n")
    git(seed, 'push', '--quiet', 'origin', 'master')
    git(root, 'clone', '--quiet', root.join('origin.git').to_s, 'server')
    write_stand_ins
  end

  def commit(files, message = 'change')
    files.each { |path, body| seed.join(path).dirname.mkpath && File.write(seed.join(path), body) }
    git(seed, 'add', '--all')
    git(seed, 'commit', '--quiet', '-m', message)
    git(seed, 'rev-parse', 'HEAD')
  end

  # Commits on master in origin and tags the result, as a merged change would be.
  def release(tag, files)
    sha = commit(files)
    git(seed, 'tag', tag)
    git(seed, 'push', '--quiet', 'origin', 'master', tag)
    sha
  end

  def write_stand_ins
    bin = root.join('fake-bin').tap(&:mkpath)
    # A run given anything but an empty input (/dev/null is a character device) is logged, as one fed the SSH session can hang.
    File.write(bin.join('docker'), "#!/bin/sh\necho \"$*\" >> '#{docker_log}'\n" \
                                   "[ \"$2\" != run ] || [ -c /dev/stdin ] || echo 'run with open input' >> '#{docker_log}'\n" \
                                   "[ \"$2\" != build ] || [ -z \"$FAKE_BUILD_FAILS\" ] || exit 1\n" \
                                   "[ \"$2\" != run ] || [ -z \"$FAKE_MIGRATE_FAILS\" ]\n")
    File.write(bin.join('curl'), "#!/bin/sh\necho \"$*\" >> '#{curl_log}'\nprintf '%s' \"${FAKE_HTTP_STATUS:-200}\"\n[ \"${FAKE_HTTP_STATUS:-200}\" = 200 ]\n")
    [bin.join('docker'), bin.join('curl')].each { |file| File.chmod(0o755, file) }
  end

  def deploy(*args, ssh_command: nil, status: 200, build_fails: false, migrate_fails: false)
    env = isolated_env.merge('PATH' => "#{root.join('fake-bin')}:#{ENV['PATH']}", 'FAKE_HTTP_STATUS' => status.to_s,
                             'DEPLOY_HEALTH_TRIES' => '2', 'DEPLOY_HEALTH_INTERVAL' => '0')
    env['FAKE_BUILD_FAILS'] = '1' if build_fails
    env['FAKE_MIGRATE_FAILS'] = '1' if migrate_fails
    env['SSH_ORIGINAL_COMMAND'] = ssh_command if ssh_command
    out, err, result = Open3.capture3(env, server.join('bin', 'deploy').to_s, *args)
    { out: out, err: err, code: result.exitstatus }
  end

  def docker_calls = docker_log.exist? ? docker_log.read.lines.map(&:strip) : []
  def build_call = 'compose build web'
  def migrate_call = 'compose run --rm -T web bundle exec rake db:migrate'
  def deploy_calls = [build_call, migrate_call, 'compose up -d --force-recreate web']
  def curl_calls = curl_log.exist? ? curl_log.read.lines.map(&:strip) : []
  def server_head = git(server, 'rev-parse', 'HEAD')
end

describe 'bin/deploy' do
  include DeployHarness

  before { build_repositories }
  after { FileUtils.rm_rf(root) }

  def expect_refused(result, code: 2)
    expect(result[:code]).to eq code
    expect(docker_calls).to eq []
  end

  context 'with a request it does not accept' do
    let!(:head) { server_head }

    after { expect(server_head).to eq head }

    it 'refuses no request at all' do
      expect_refused(deploy)
    end

    it 'refuses a verb other than deploy' do
      expect_refused(deploy('status', 'v1'))
    end

    ['v1; rm -rf ~', 'v1 extra', '1.2', 'v', 'v1.', 'v1..2', 'v1.2-beta', '-v1', "v1\n"].each do |tag|
      it "refuses the tag #{tag.inspect}" do
        expect_refused(deploy('deploy', tag))
      end
    end

    it 'refuses extra words after the tag over SSH' do
      expect_refused(deploy(ssh_command: 'deploy v1 && touch owned'))
      expect(server.join('owned')).not_to exist
    end

    it 'takes the request from SSH_ORIGINAL_COMMAND over its arguments' do
      expect_refused(deploy('deploy', 'v1', ssh_command: 'shell'))
    end
  end

  context 'with a tag it must not deploy' do
    let!(:head) { server_head }

    after do
      expect(server_head).to eq head
      expect(docker_calls).to eq []
    end

    it 'refuses when a tracked file was changed on the server' do
      release('v2', 'app.rb' => "puts 'v2'\n")
      File.write(server.join('app.rb'), "puts 'edited on the server'\n")

      expect(deploy('deploy', 'v2')).to include(code: 1, err: /uncommitted changes/)
    end

    it 'refuses when the server is not on master' do
      release('v2', 'app.rb' => "puts 'v2'\n")
      git(server, 'switch', '--quiet', '-c', 'hotfix')

      expect(deploy('deploy', 'v2')).to include(code: 1, err: /not on master/)
      git(server, 'switch', '--quiet', 'master')
    end

    it 'refuses a tag that is not on master' do
      git(seed, 'switch', '--quiet', '-c', 'feature')
      commit('app.rb' => "puts 'unreviewed'\n")
      git(seed, 'tag', 'v2')
      git(seed, 'push', '--quiet', 'origin', 'v2')

      expect(deploy('deploy', 'v2')).to include(code: 1, err: /not on master/)
    end

    it 'refuses a tag that does not exist' do
      expect(deploy('deploy', 'v9')).to include(code: 1)
    end

    it 'refuses a tag behind the server' do
      release('v2', 'app.rb' => "puts 'v2'\n")
      release('v3', 'app.rb' => "puts 'v3'\n")
      git(server, 'pull', '--quiet', '--ff-only')
      head.replace(server_head)

      expect(deploy('deploy', 'v2')).to include(code: 1, err: /behind/)
    end

    it 'refuses a tag that was moved after the server fetched it' do
      release('v2', 'app.rb' => "puts 'v2'\n")
      deploy('deploy', 'v2')
      docker_log.delete if docker_log.exist?
      head.replace(server_head)
      commit('app.rb' => "puts 'v2, moved'\n")
      git(seed, 'tag', '--force', 'v2')
      git(seed, 'push', '--quiet', '--force', 'origin', 'master', 'v2')

      expect(deploy('deploy', 'v2')).to include(code: 1, err: /could not fetch v2/)
    end
  end

  context 'with a tag it can deploy' do
    it 'fast-forwards master to a tag ahead of it' do
      sha = release('v2', 'app.rb' => "puts 'v2'\n")

      expect(deploy('deploy', 'v2')[:code]).to eq 0
      expect(server_head).to eq sha
      expect(git(server, 'rev-parse', '--abbrev-ref', 'HEAD')).to eq 'master'
      expect(server.join('app.rb').read).to eq "puts 'v2'\n"
    end

    it 'redeploys the tag the server is already on without moving it' do
      sha = release('v2', 'app.rb' => "puts 'v2'\n")
      deploy('deploy', 'v2')

      expect(deploy('deploy', 'v2')[:code]).to eq 0
      expect(server_head).to eq sha
    end

    it 'ignores untracked files such as .env' do
      sha = release('v2', 'app.rb' => "puts 'v2'\n")
      File.write(server.join('.env'), "SECRET=x\n")

      expect(deploy('deploy', 'v2')[:code]).to eq 0
      expect(server_head).to eq sha
    end

    it 'builds, migrates and recreates the app when only code changed' do
      release('v2', 'app.rb' => "puts 'v2'\n", 'spec/app_spec.rb' => "# spec\n")

      deploy('deploy', 'v2')

      expect(docker_calls).to eq deploy_calls
    end

    it 'builds, migrates and recreates the app on a redeploy' do
      release('v2', 'app.rb' => "puts 'v2'\n")
      deploy('deploy', 'v2')
      docker_log.delete

      deploy('deploy', 'v2')

      expect(docker_calls).to eq deploy_calls
    end

    %w[Gemfile Gemfile.lock Dockerfile docker-compose.yml].each do |file|
      it "builds before migrating when #{file} changed" do
        release('v2', 'app.rb' => "puts 'v2'\n", file => "changed\n")

        deploy('deploy', 'v2')

        expect(docker_calls).to eq deploy_calls
      end
    end

    it 'stops without restarting when a migration fails, and runs them again when the tag is redeployed' do
      release('v2', 'app.rb' => "puts 'v2'\n", 'db/migrate/20261031000000_add_handle.rb' => "# migration\n")

      result = deploy('deploy', 'v2', migrate_fails: true)

      expect(result).to include(code: 1, err: /migrat/i)
      expect(docker_calls).to eq [build_call, migrate_call]
      expect(curl_calls).to eq []
      docker_log.delete

      expect(deploy('deploy', 'v2')[:code]).to eq 0
      expect(docker_calls).to eq deploy_calls
    end

    it 'stops without migrating or restarting when the image does not build' do
      release('v2', 'Gemfile.lock' => "GEM\n  rack\n")

      result = deploy('deploy', 'v2', build_fails: true)

      expect(result).to include(code: 1, err: /build/i)
      expect(docker_calls).to eq [build_call]
      expect(curl_calls).to eq []
    end

    # v2026.11.06.0: the first attempt failed for want of the new gems, and the retry, with no diff left, never rebuilt.
    it 'builds again when a failed gem update is redeployed' do
      release('v2', 'Gemfile.lock' => "GEM\n  rack\n")
      deploy('deploy', 'v2', migrate_fails: true)
      docker_log.delete

      expect(deploy('deploy', 'v2')[:code]).to eq 0
      expect(docker_calls).to eq deploy_calls
    end

    it 'succeeds when the site answers 200, checking mmdb.online by default' do
      release('v2', 'app.rb' => "puts 'v2'\n")

      expect(deploy('deploy', 'v2', status: 200)[:code]).to eq 0
      expect(curl_calls.size).to eq 1
      expect(curl_calls.first).to end_with('https://mmdb.online/')
    end

    it 'fails when the site keeps answering something else' do
      release('v2', 'app.rb' => "puts 'v2'\n")

      result = deploy('deploy', 'v2', status: 502)

      expect(result).to include(code: 1, err: /mmdb\.online.*502 after 2 tries/)
      expect(curl_calls.size).to eq 2
    end

    it 'says what it deployed and how' do
      old = server_head
      new = release('v2', 'Gemfile.lock' => "GEM\n  rack\n")

      out = deploy('deploy', 'v2')[:out]

      expect(out).to include('v2', old[0, 7], new[0, 7])
    end

    it 'says when it is redeploying' do
      release('v2', 'app.rb' => "puts 'v2'\n")
      deploy('deploy', 'v2')

      expect(deploy('deploy', 'v2')[:out]).to match(/redeploy/i)
    end

    it 'deploys the tag named over SSH' do
      sha = release('v2', 'app.rb' => "puts 'v2'\n")

      expect(deploy(ssh_command: 'deploy v2')[:code]).to eq 0
      expect(server_head).to eq sha
    end
  end
end

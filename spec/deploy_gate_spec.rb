require 'open3'
require 'tmpdir'

# Runs deploy.yml's gate step itself, with stand-in git, gh and sleep, so no network or waiting is involved.
describe 'the deploy gate' do
  let(:script) do
    steps = YAML.safe_load_file(APP_ROOT.join('.github', 'workflows', 'deploy.yml'))['jobs']['deploy']['steps']
    steps.find { |step| step['name'] == 'Check the tag is a tested commit on master' }['run']
  end

  # The test check's state on each look, in order; the last one repeats.
  def gate(*states)
    Dir.mktmpdir do |bin|
      File.write("#{bin}/states", states.join("\n") + "\n")
      git = <<~SH
        case "$1" in rev-parse) echo 9289026;; merge-base) exit 0;; esac
      SH
      gh = <<~SH
        echo x >> "#{bin}/looks"
        line=$(sed -n "$(wc -l < "#{bin}/looks")p" "#{bin}/states")
        echo "${line:-$(tail -1 "#{bin}/states")}"
      SH
      { 'git' => git, 'gh' => gh, 'sleep' => "exit 0\n" }.each { |name, body| File.write("#{bin}/#{name}", "#!/bin/bash\n#{body}", perm: 0o755) }
      env = { 'PATH' => "#{bin}:#{ENV['PATH']}", 'TAG' => 'v2026.10.29.10', 'GITHUB_REPOSITORY' => 'toddseller/MMDb', 'GH_TOKEN' => 'x' }
      output, status = Open3.capture2e(env, 'bash', '--noprofile', '--norc', '-eo', 'pipefail', '-c', script)
      { output: output, passed: status.success?, looks: File.readlines("#{bin}/looks").size }
    end
  end

  # Since the Tests workflow became parallel jobs, the test check exists only once the other jobs finish.
  it 'waits for a test check that has not been created yet' do
    result = gate('missing', 'missing', 'success')

    expect(result[:passed]).to be true
    expect(result[:looks]).to eq 3
  end

  it 'stops when the tests fail' do
    result = gate('running', 'failure')

    expect(result[:passed]).to be false
    expect(result[:output]).to include 'the test check for 9289026 is failure'
  end

  it 'stops after the wait when the test check never appears' do
    result = gate('missing')

    expect(result[:passed]).to be false
    expect(result[:looks]).to eq 45
    expect(result[:output]).to include 'the test check for 9289026 is missing'
  end
end

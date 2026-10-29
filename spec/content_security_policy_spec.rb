describe 'content security policy' do
  # An enforced policy blocks both; the report-only one would report every page that has them.
  it 'finds no inline handlers or style attributes in views or scripts' do
    files = Dir[APP_ROOT.join('app', 'views', '**', '*.erb')] + Dir[APP_ROOT.join('public', 'js', 'mmdb', '*.js')]
    offenders = files.flat_map do |file|
      File.readlines(file).each_with_index.select { |line, _| line.match?(/\s(on[a-z]+|style)=["']/i) }.map { |_, i| "#{Pathname(file).relative_path_from(APP_ROOT)}:#{i + 1}" }
    end
    expect(offenders).to be_empty
  end

  describe 'the report-only header' do
    let(:page) { get('/', xhr: false) }
    let(:policy) { page['content-security-policy-report-only'].split(/;\s*/) }

    it 'allows only the site, Cloudflare Web Analytics, and the import map by its hash' do
      import_map = page.body[%r{<script type="importmap">(.*?)</script>}m, 1]
      expect(policy).to include("script-src 'self' https://static.cloudflareinsights.com 'sha256-#{Digest::SHA256.base64digest(import_map)}'")
      expect(policy).to include("default-src 'self'", "style-src 'self'", "img-src 'self' https: data:", "connect-src 'self' https://cloudflareinsights.com",
                                "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'",
                                'report-uri /csp-reports')
    end

    it 'is not enforced yet' do
      expect(page['content-security-policy']).to be_nil
    end
  end

  describe 'POST /csp-reports' do
    def report(body)
      post('/csp-reports', env: { input: body, 'CONTENT_TYPE' => 'application/csp-report' }, xhr: false)
    end

    let(:violation) do
      { 'csp-report' => { 'document-uri' => 'https://mmdb.online/users/1?letter=a', 'effective-directive' => 'img-src',
                          'violated-directive' => 'img-src', 'blocked-uri' => 'http://video.itunes.apple.com/a.jpg?token=x' } }.to_json
    end

    it 'logs one line without query strings and answers 204 without a session' do
      response = nil
      expect { response = report(violation) }.to output("CSP img-src blocked http://video.itunes.apple.com/a.jpg on /users/1\n").to_stdout
      expect(response.status).to eq 204
      expect(response['set-cookie']).to be_nil
    end

    # Anyone can post here, so a field must not be able to start a fake log line.
    it 'keeps a report on one line' do
      forged = { 'csp-report' => { 'document-uri' => 'https://mmdb.online/', 'violated-directive' => "img-src\nCSP forged",
                                   'blocked-uri' => 'inline' } }.to_json
      expect { report(forged) }.to output("CSP img-srcCSP forged blocked inline on /\n").to_stdout
    end

    it 'refuses a body over 8 KB without logging it' do
      response = nil
      expect { response = report('x' * 9 * 1024) }.not_to output.to_stdout
      expect(response.status).to eq 400
    end

    it 'refuses a body that is not a report without logging it' do
      response = nil
      expect { response = report({ 'hello' => 'world' }.to_json) }.not_to output.to_stdout
      expect(response.status).to eq 400
    end

    # An error here would log a whole backtrace, which anyone could repeat to flood the log.
    it 'refuses JSON that is not an object without an error' do
      %w[[] null 1].each { |body| expect(report(body).status).to eq 400 }
    end
  end
end

describe 'POST /users/:user_id/shows/:id/artwork' do
  JPEG = "\xFF\xD8\xFF\xE0".b + ('j' * 200)
  PNG = "\x89PNG\r\n\x1A\n".b + ('p' * 200)
  S3_OBJECT = %r{\Ahttps://myflix-stream\.s3\.us-west-2\.amazonaws\.com/images/([A-Za-z0-9]{27})\.(jpg|png)\z}

  let(:user) { create_user }
  let(:show) { create_show(user) }

  before { stub_request(:put, S3_OBJECT) }

  def upload(bytes, filename: 'square.jpg', type: 'image/jpeg', user_id: user.id, show_id: show.id)
    body = Rack::Multipart.build_multipart('artwork' => Rack::Multipart::UploadedFile.new(nil, type, true, io: StringIO.new(bytes), filename: filename))
    post("/users/#{user_id}/shows/#{show_id}/artwork", env: { input: body, 'CONTENT_TYPE' => "multipart/form-data; boundary=#{Rack::Multipart::MULTIPART_BOUNDARY}" })
  end

  def stored_body(key)
    request = WebMock::RequestRegistry.instance.requested_signatures.hash.keys.find { |r| r.method == :put && r.uri.path == "/#{key}" }
    request.body
  end

  context 'for the signed-in owner' do
    before { log_in(user, 'secret') }

    it 'stores a JPEG and answers with its CDN URL' do
      response = upload(JPEG)

      expect(response.status).to eq 200
      url = JSON.parse(response.body)['url']
      expect(url).to match(%r{\Ahttps://cdn\.myflix\.stream/images/[A-Za-z0-9]{27}\.jpg\z})
      key = URI(url).path.delete_prefix('/')
      expect(a_request(:put, "https://myflix-stream.s3.us-west-2.amazonaws.com/#{key}").with(headers: { 'Content-Type' => 'image/jpeg' })).to have_been_made.once
      expect(stored_body(key)).to include(JPEG)
    end

    it 'stores a PNG with its own extension and type' do
      url = JSON.parse(upload(PNG, filename: 'square.png', type: 'image/png').body)['url']

      expect(url).to end_with('.png')
      expect(a_request(:put, "https://myflix-stream.s3.us-west-2.amazonaws.com#{URI(url).path}").with(headers: { 'Content-Type' => 'image/png' })).to have_been_made
    end

    it 'gives every upload a new name' do
      urls = 2.times.map { JSON.parse(upload(JPEG).body)['url'] }

      expect(urls.uniq.size).to eq 2
    end

    it 'leaves the stored posters alone' do
      season = show.seasons.first
      expect { upload(JPEG) }.not_to(change { [show.reload.poster, season.reload.poster] })
    end
  end

  context 'with a file it cannot take' do
    before { log_in(user, 'secret') }

    def error_of(response) = [response.status, JSON.parse(response.body)['error']]

    it 'rejects a text file dressed up as a JPEG' do
      expect(error_of(upload('just some text', filename: 'poster.jpg'))).to eq [422, 'Only JPEG and PNG files are accepted.']
      expect(a_request(:put, S3_OBJECT)).not_to have_been_made
    end

    it 'rejects a JPEG over 5 MB' do
      too_big = JPEG + ('j' * (5 * 1024 * 1024))

      expect(error_of(upload(too_big))).to eq [422, 'Artwork must be 5 MB or smaller.']
      expect(a_request(:put, S3_OBJECT)).not_to have_been_made
    end

    it 'rejects a request without a file' do
      response = post("/users/#{user.id}/shows/#{show.id}/artwork")

      expect(error_of(response)).to eq [422, 'Choose a JPEG or PNG file to upload.']
      expect(a_request(:put, S3_OBJECT)).not_to have_been_made
    end

    [403, 500].each do |code|
      it "reports storage answering #{code} without its details" do
        stub_request(:put, S3_OBJECT).to_return(status: code, body: '<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>')
        response = nil
        expect { response = upload(JPEG) }.to output("artwork upload failed: Aws::S3::Errors::AccessDenied\n").to_stderr

        expect(error_of(response)).to eq [502, "The artwork couldn't be stored. Try again."]
        expect(response.body.include?('AccessDenied') || response.body.include?(ENV['AWS_SECRET_ACCESS_KEY']) || response.body.include?(ENV['AWS_ACCESS_KEY_ID'])).to be false
        expect(show.reload.poster).not_to start_with(Artwork::CDN)
      end
    end
  end

  context 'when the server has no storage credentials' do
    # Without these the SDK would fall back to ~/.aws on the developer's machine or the EC2 metadata endpoint.
    AWS_LOOKUPS = { 'AWS_ACCESS_KEY_ID' => nil, 'AWS_SECRET_ACCESS_KEY' => nil, 'AWS_SHARED_CREDENTIALS_FILE' => '/nonexistent',
                    'AWS_CONFIG_FILE' => '/nonexistent', 'AWS_EC2_METADATA_DISABLED' => 'true' }

    around do |example|
      saved = AWS_LOOKUPS.keys.to_h { |name| [name, ENV[name]] }
      AWS_LOOKUPS.each { |name, value| ENV[name] = value }
      example.run
    ensure
      saved.each { |name, value| ENV[name] = value }
    end

    it 'answers with the storage failure message' do
      log_in(user, 'secret')
      response = nil
      expect { response = upload(JPEG) }.to output(/artwork upload failed: Aws::Errors::MissingCredentialsError/).to_stderr

      expect([response.status, JSON.parse(response.body)['error']]).to eq [502, "The artwork couldn't be stored. Try again."]
      expect(a_request(:put, S3_OBJECT)).not_to have_been_made
      expect(show.reload.poster).not_to start_with(Artwork::CDN)
    end
  end

  context 'for anyone else' do
    let(:other) { create_user }

    it 'refuses a visitor who is not signed in' do
      expect(upload(JPEG).status).to eq 401
      expect(a_request(:put, S3_OBJECT)).not_to have_been_made
    end

    it "refuses a signed-in user uploading for a show outside their collection" do
      log_in(other, 'secret')

      expect(upload(JPEG, user_id: other.id).status).to eq 401
      expect(a_request(:put, S3_OBJECT)).not_to have_been_made
    end

    it "refuses a post from another site even with the owner's cookie" do
      log_in(user, 'secret')
      body = Rack::Multipart.build_multipart('artwork' => Rack::Multipart::UploadedFile.new(nil, 'image/jpeg', true, io: StringIO.new(JPEG), filename: 'a.jpg'))
      env = { input: body, 'CONTENT_TYPE' => "multipart/form-data; boundary=#{Rack::Multipart::MULTIPART_BOUNDARY}", 'HTTP_ORIGIN' => 'https://evil.example' }

      expect(post("/users/#{user.id}/shows/#{show.id}/artwork", env: env, xhr: false).status).to eq 401
      expect(a_request(:put, S3_OBJECT)).not_to have_been_made
    end

    it "refuses a signed-in user using another user's URL" do
      log_in(other, 'secret')

      expect(upload(JPEG, user_id: user.id).status).to eq 401
      expect(a_request(:put, S3_OBJECT)).not_to have_been_made
    end
  end
end

describe 'the show edit modal' do
  it 'offers an artwork upload next to the poster URL field' do
    user = create_user
    show = create_show(user)
    show.seasons.last.update!(is_active: true)
    log_in(user, 'secret')
    tab = Nokogiri::HTML(JSON.parse(get("/users/#{user.id}/shows/#{show.id}/edit").body)).at_css('#artwork')

    expect(tab.at_css('input[type="file"][name="artwork"]')&.[]('accept')).to eq 'image/jpeg,image/png'
    expect(tab.at_css('input[type="file"]')['data-upload']).to eq "/users/#{user.id}/shows/#{show.id}/artwork"
    expect(tab.at_css('.artwork-message')).not_to be_nil
    expect(tab.at_css('input[name="season[poster]"]')).not_to be_nil
  end
end

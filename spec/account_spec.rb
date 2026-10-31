describe 'account settings' do
  let(:user) { create_user }

  before { log_in(user, 'secret-password') }

  def save(**params)
    request('PUT', "/users/#{user.id}", params: { first_name: 'Ann', last_name: 'Lee', user_name: user.user_name, email: user.email, current: '' }.merge(params))
  end

  # The theme the next page is drawn in, which comes from the session.
  def shown_theme = Nokogiri::HTML(get("/u/#{user.handle}", xhr: false).body).at_css('html')['data-theme']

  %w[default dark system].each do |theme|
    it "stores the #{theme} theme" do
      user.update_columns(theme: theme == 'dark' ? 'default' : 'dark')

      expect(JSON.parse(save(theme: theme).body)['status']).to eq 'true'

      expect(user.reload.theme).to eq theme
    end
  end

  it 'offers Light, Dark and System, with the saved one chosen' do
    user.update_columns(theme: 'system')

    radios = Nokogiri::HTML(get("/users/#{user.id}/edit").body).css('input[type="radio"][name="theme"]')

    expect(radios.map { |radio| radio['value'] }).to eq %w[default dark system]
    expect(radios.select { |radio| radio['checked'] }.map { |radio| radio['value'] }).to eq %w[system]
    expect(radios.map { |radio| radio.ancestors('label').first&.text&.strip }).to eq %w[Light Dark System]
  end

  it 'stores the theme when the password changes too' do
    user.update_columns(theme: 'dark')

    save(theme: 'default', current: 'secret-password', password: 'secret-password', confirm: 'secret-password')

    expect(user.reload.theme).to eq 'default'
  end

  it 'refuses an unknown theme, keeping the saved one on the next page' do
    user.update_columns(theme: 'dark')
    log_in(user, 'secret-password')

    expect(JSON.parse(save(theme: 'bogus').body)['status']).to eq 'false'

    expect(user.reload.theme).to eq 'dark'
    expect(shown_theme).to eq 'dark'
  end

  it 'stores a new handle, lowercased' do
    expect(JSON.parse(save(handle: 'Todd', theme: 'default').body)['status']).to eq 'true'

    expect(user.reload.handle).to eq 'todd'
  end

  ['-todd', 'to'].each do |handle|
    it "refuses the handle #{handle.inspect}, saving nothing" do
      before = user.handle

      expect(JSON.parse(save(handle: handle, theme: 'default', first_name: 'Changed').body)['status']).to eq 'false'

      expect(user.reload).to have_attributes(handle: before, first_name: "User#{user.user_name[/\d+/]}")
    end
  end

  it 'refuses a handle another user has, now or as an old one' do
    other = create_user
    other.update!(handle: 'gone')
    other.update!(handle: 'here')

    expect(JSON.parse(save(handle: 'here', theme: 'default').body)['status']).to eq 'false'
    expect(JSON.parse(save(handle: 'gone', theme: 'default').body)['status']).to eq 'false'
  end

  it 'shows the handle in a labelled field, with the collection’s address' do
    form = Nokogiri::HTML(get("/users/#{user.id}/edit").body)
    field = form.at_css('input[name="handle"]')

    expect(field.to_h).to include('value' => user.handle, 'autocomplete' => 'off')
    expect(form.at_css("label[for='#{field['id']}']").text.strip).to eq 'Handle:'
    expect(form.text).to include("/u/#{user.handle}")
  end

  it 'names the handle’s rule in the refusal message' do
    message = Nokogiri::HTML(get("/users/#{user.id}/edit").body).at_css('.login-errors').text

    expect(message).to include('handle', '3 to 30 lowercase letters, digits or hyphens')
  end

  it 'says a save refused for another reason failed' do
    other = create_user

    expect(JSON.parse(save(theme: 'default', email: other.email).body)['status']).to eq 'false'

    expect(user.reload.email).not_to eq other.email
  end
end

describe 'the page theme' do
  def page(path = '/') = Nokogiri::HTML(get(path, xhr: false).body)

  %w[default dark system].each do |theme|
    it "is the signed-in user's saved #{theme} theme" do
      user = create_user
      user.update_columns(theme: theme)
      log_in(user, 'secret-password')

      expect(page("/u/#{user.handle}").at_css('html')['data-theme']).to eq theme
    end
  end

  it "is System for a visitor" do
    expect(page.at_css('html')['data-theme']).to eq 'system'
  end

  it 'is System after signing out' do
    user = create_user
    user.update_columns(theme: 'dark')
    log_in(user, 'secret-password')

    post("/sessions/#{user.id}", xhr: false)

    expect(page.at_css('html')['data-theme']).to eq 'system'
  end

  # A session can outlive a change to the allowed values, and the attribute is read by the stylesheet.
  it 'is System for a theme the page does not know' do
    user = create_user
    user.update_columns(theme: 'sepia')
    log_in(user, 'secret-password')

    expect(page("/u/#{user.handle}").at_css('html')['data-theme']).to eq 'system'
  end

  it 'comes with the same stylesheets for every theme, all its own' do
    user = create_user
    log_in(user, 'secret-password')
    stylesheets = %w[default dark].map do |theme|
      user.update_columns(theme: theme)
      page("/u/#{user.handle}").css('link[rel="stylesheet"]').map { |link| link['href'] }
    end

    expect(stylesheets.first).to all(match(%r{\A/css/[\w.-]+\.css\?v=\d+\z}))
    expect(stylesheets.last).to eq stylesheets.first
    expect(page.at_css('link#theme')).to be_nil
  end
end

describe 'registering' do
  # A visitor is on System, so a new account keeps the theme they were just looking at.
  it 'starts the new account on the System theme' do
    post('/users', params: { user: { first_name: 'New', last_name: 'User', user_name: 'newcomer', email: 'newcomer@example.test', password: 'secret-password' } }, xhr: false)

    user = User.find_by!(user_name: 'newcomer')
    expect(user.theme).to eq 'system'
    expect(Nokogiri::HTML(get("/u/#{user.handle}", xhr: false).body).at_css('html')['data-theme']).to eq 'system'
  end

  it 'sends a form with no fields back to registration' do
    response = post('/users', xhr: false)

    expect(response).to be_redirect
    expect(response['location']).to include '/users/new'
  end
end

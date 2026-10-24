describe 'account settings' do
  let(:user) { create_user }

  before { log_in(user, 'secret') }

  def save(**params)
    request('PUT', "/users/#{user.id}", params: { first_name: 'Ann', last_name: 'Lee', user_name: user.user_name, email: user.email, current: '' }.merge(params))
  end

  it 'stores the light theme when the switch is off' do
    user.update_columns(theme: 'dark')

    save

    expect(user.reload.theme).to eq 'default'
  end

  it 'stores the dark theme when the switch is on' do
    save(theme: 'dark')

    expect(user.reload.theme).to eq 'dark'
  end

  it 'stores the light theme when the password changes too' do
    user.update_columns(theme: 'dark')

    save(current: 'secret', password: 'secret', confirm: 'secret')

    expect(user.reload.theme).to eq 'default'
  end
end

describe 'the theme stylesheet' do
  def theme_link(path = '/')
    Nokogiri::HTML(get(path, xhr: false).body).at_css('link#theme')
  end

  it 'carries both themes as versioned URLs' do
    link = theme_link

    expect(link['data-default']).to match(%r{\A/css/default\.css\?v=\w+\z})
    expect(link['data-dark']).to match(%r{\A/css/dark\.css\?v=\w+\z})
  end

  it "loads the signed-in user's light theme" do
    user = create_user
    log_in(user, 'secret')

    link = theme_link("/users/#{user.id}")

    expect(link['href']).to eq link['data-default']
  end

  it "loads the signed-in user's dark theme" do
    user = create_user
    user.update_columns(theme: 'dark')
    log_in(user, 'secret')

    link = theme_link("/users/#{user.id}")

    expect(link['href']).to eq link['data-dark']
  end
end

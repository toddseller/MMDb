describe 'a user handle' do
  def register(user_name)
    n = Factories.next_number
    User.create!(first_name: 'A', last_name: 'B', user_name: user_name, email: "handle#{n}@example.test", password: 'secret-password')
  end

  it 'is made from the user name for a new user' do
    expect(register('Todd Séller').handle).to eq 'todd-seller'
  end

  it 'is numbered when the one made from the user name is taken' do
    register('Todd Seller')

    expect(register('todd_seller').handle).to eq 'todd-seller-2'
  end

  it 'falls back to the id when the user name has no usable characters' do
    user = register('!!')

    expect(user.handle).to eq "user-#{user.id}"
  end

  it 'numbers the id fallback too when another user already has it' do
    taken = register('User Next')
    taken.update!(handle: "user-#{User.connection.select_value("SELECT last_value FROM users_id_seq").to_i + 1}")

    user = register('!!')

    expect(user.handle).to eq "user-#{user.id}-2"
  end

  it 'is stored lowercase' do
    user = create_user
    user.update!(handle: 'Todd')

    expect(user.reload.handle).to eq 'todd'
  end

  %w[to -todd todd- to\ do].push('a' * 31).each do |handle|
    it "refuses #{handle.inspect}" do
      user = create_user

      expect(user.update(handle: handle)).to be false
      expect(user.reload.handle).not_to eq handle
    end
  end

  it 'refuses a handle another user has' do
    create_user.update!(handle: 'taken')

    expect(create_user.update(handle: 'taken')).to be false
  end

  it 'keeps an old handle for its owner when it changes, so no one else can take it' do
    owner = create_user
    owner.update!(handle: 'todd-seller')
    owner.update!(handle: 'todd')

    expect(UserHandle.find_by(handle: 'todd-seller').user).to eq owner
    expect(create_user.update(handle: 'todd-seller')).to be false
  end

  it 'lets the owner change back to an old handle, which then stops being an old one' do
    owner = create_user
    owner.update!(handle: 'todd-seller')
    owner.update!(handle: 'todd')

    owner.update!(handle: 'todd-seller')

    expect(owner.reload.handle).to eq 'todd-seller'
    expect(owner.old_handles.pluck(:handle)).to include('todd')
    expect(owner.old_handles.pluck(:handle)).not_to include('todd-seller')
  end
end

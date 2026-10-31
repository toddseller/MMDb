# Production's users get their handles from this migration, run by a deploy against a database like the scratch one.
describe 'the handles migration' do
  include ScratchDatabase

  VERSION = '20261031200000'

  # db/structure.sql already has the handles, so the scratch database is taken back to before this migration, as production is.
  around do |example|
    build_scratch_database
    output, status = scratch_rake('db:migrate', 'VERSION' => (migration_versions - [VERSION]).last)
    raise output unless status.success?

    example.run
  ensure
    drop_scratch_database
  end

  def add_user(id, user_name)
    scratch_sql(command: "INSERT INTO users (id, first_name, last_name, user_name, email, password_hash, created_at, updated_at) " \
                         "VALUES (#{id}, 'A', 'B', '#{user_name}', 'u#{id}@example.test', 'x', now(), now())")
  end

  it 'gives every existing user a handle made from their user name, in id order' do
    add_user(1, 'Todd Seller')
    add_user(2, 'todd_seller')
    add_user(42, '!!')

    output, status = scratch_rake('db:migrate')

    expect(status).to be_success, output
    expect(scratch_sql(command: 'SELECT id, handle FROM users ORDER BY id').lines.map(&:strip)).to eq ['1|todd-seller', '2|todd-seller-2', '42|user-42']
  end

  it 'makes handles required and unique, with a table for old ones' do
    output, status = scratch_rake('db:migrate')
    expect(status).to be_success, output

    expect(scratch_sql(command: "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'handle'").strip).to eq 'NO'
    expect(scratch_sql(command: "SELECT indexdef FROM pg_indexes WHERE tablename IN ('users', 'user_handles') AND indexdef LIKE '%UNIQUE%(handle)%'").lines.size).to eq 2
    expect(scratch_sql(command: "SELECT confdeltype FROM pg_constraint WHERE conrelid = 'user_handles'::regclass AND contype = 'f'").strip).to eq 'c'
  end
end

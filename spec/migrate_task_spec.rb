# Every deploy runs rake db:migrate, so it has to work on the ActiveRecord the app runs, against a database like production's.
describe 'rake db:migrate' do
  include ScratchDatabase

  around do |example|
    build_scratch_database
    example.run
  ensure
    drop_scratch_database
  end

  it 'changes nothing on a database that has every migration' do
    before = scratch_sql(command: 'SELECT count(*) FROM schema_migrations')

    output, status = scratch_rake('db:migrate')

    expect(status).to be_success, output
    expect(scratch_sql(command: 'SELECT count(*) FROM schema_migrations')).to eq before
  end

  it 'reports the latest version with rake db:version' do
    output, status = scratch_rake('db:version')

    expect(status).to be_success, output
    expect(output).to include(migration_versions.last)
  end
end

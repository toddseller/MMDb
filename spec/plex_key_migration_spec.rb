describe 'the Plex key migration' do
  include ScratchDatabase

  def version = '20261118000000'

  around do |example|
    build_scratch_database(migration_versions - [version])
    scratch_sql(command: 'ALTER TABLE movies DROP COLUMN plex_key; ALTER TABLE shows DROP COLUMN plex_key')
    example.run
  ensure
    drop_scratch_database
  end

  it 'adds an indexed plex_key to movies and shows' do
    output, status = scratch_rake('db:migrate')

    expect(status).to be_success, output
    columns = scratch_sql(command: "SELECT table_name, data_type FROM information_schema.columns WHERE column_name = 'plex_key' ORDER BY table_name")
    expect(columns.split("\n")).to eq ['movies|integer', 'shows|integer']
    expect(scratch_sql(command: "SELECT indexname FROM pg_indexes WHERE indexname LIKE '%plex_key' ORDER BY 1").split("\n"))
      .to eq %w[index_movies_on_plex_key index_shows_on_plex_key]
  end
end

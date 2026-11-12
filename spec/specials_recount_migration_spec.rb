# Production's stored season counts for shows that already have specials are corrected by this migration, run by a deploy.
describe 'the specials recount migration' do
  include ScratchDatabase

  def version = '20261112000000'

  around do |example|
    build_scratch_database(migration_versions - [version])
    example.run
  ensure
    drop_scratch_database
  end

  def add_show(id, seasons, season_count)
    scratch_sql(command: "INSERT INTO shows (id, title, \"seasonCount\", created_at, updated_at) VALUES (#{id}, 'Show #{id}', '#{season_count}', now(), now())")
    rows = seasons.map { |number| "(#{number}, #{id}, now(), now())" }.join(', ')
    scratch_sql(command: "INSERT INTO seasons (season, show_id, created_at, updated_at) VALUES #{rows}")
  end

  it "recounts a show with specials, leaving the specials out" do
    add_show(1, (0..14).to_a, 15)

    output, status = scratch_rake('db:migrate')

    expect(status).to be_success, output
    expect(scratch_sql(command: 'SELECT "seasonCount", "seasonNumbers" FROM shows WHERE id = 1').strip).to eq '14|14'
  end

  it 'leaves a show without specials alone' do
    add_show(2, [1, 2], 'unchanged')

    scratch_rake('db:migrate')

    expect(scratch_sql(command: 'SELECT "seasonCount" FROM shows WHERE id = 2').strip).to eq 'unchanged'
  end
end

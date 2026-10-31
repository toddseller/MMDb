require 'open3'

# A throwaway database built as production's is: its schema from db/structure.sql, and every migration in db/migrate
# already recorded, so only a migration added since runs. Used to run rake tasks against it in a subprocess.
module ScratchDatabase
  NAME = 'MMDb_scratch'

  def migration_versions(dir = APP_ROOT.join('db', 'migrate')) = Dir[File.join(dir, '*.rb')].map { |path| File.basename(path)[/\A\d+/] }.sort

  def build_scratch_database(versions = migration_versions)
    system('dropdb', '--if-exists', NAME, exception: true)
    system('createdb', NAME, exception: true)
    scratch_sql(file: APP_ROOT.join('db', 'structure.sql').to_s)
    scratch_sql(command: "INSERT INTO schema_migrations VALUES #{versions.map { |version| "('#{version}')" }.join(', ')}")
  end

  def drop_scratch_database = system('dropdb', '--if-exists', NAME)

  def scratch_sql(command: nil, file: nil)
    args = command ? ['-c', command] : ['-f', file]
    output, status = Open3.capture2e('psql', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-d', NAME, *args)
    raise output unless status.success?

    output
  end

  def scratch_rake(task, env = {}) = Open3.capture2e({ 'DATABASE_URL' => "postgres://localhost/#{NAME}", **env }, 'bundle', 'exec', 'rake', task, chdir: APP_ROOT.to_s)
end

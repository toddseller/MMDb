# Escaping only protects quoted attributes, and <%== %> skips escaping entirely, so both are checked in every view.
describe 'views' do
  def offenders(pattern)
    Dir[APP_ROOT.join('app', 'views', '**', '*.erb')].sort.flat_map do |file|
      File.readlines(file).each_with_index.filter_map do |line, index|
        "#{file.delete_prefix("#{APP_ROOT}/")}:#{index + 1}: #{line.strip[0, 100]}" if line =~ pattern
      end
    end
  end

  it 'quote every attribute that holds an output' do
    expect(offenders(/[\w-]+=<%/)).to eq []
  end

  # The import map is JSON the server builds from module file names; escaping would break it, and it holds no user data.
  it 'output raw HTML only for the layout, partials and the import map' do
    expect(offenders(%r{<%==(?!\s*(yield|import_map\s*%>|erb :'/?partials/\w+'))})).to eq []
  end
end

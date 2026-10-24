helpers do
  # Browsers and Cloudflare keep /js and /css for 4 hours, so a deployed change needs a new URL to reach them.
  def asset_path(path)
    "#{path}?v=#{File.mtime(APP_ROOT.join('public', path.delete_prefix('/'))).to_i}"
  end

  # Modules import each other as #mmdb/<file>; this maps each name to its versioned URL so none is fetched stale.
  def import_map
    modules = Dir[APP_ROOT.join('public', 'js', 'mmdb', '*.js')].map { |file| File.basename(file) }.sort
    { imports: modules.to_h { |name| ["#mmdb/#{name}", asset_path("/js/mmdb/#{name}")] } }.to_json
  end
end

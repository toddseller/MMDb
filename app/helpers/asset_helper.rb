helpers do
  # Browsers and Cloudflare keep /js and /css for 4 hours, so a deployed change needs a new URL to reach them.
  def asset_path(path)
    "#{path}?v=#{File.mtime(APP_ROOT.join('public', path.delete_prefix('/'))).to_i}"
  end
end

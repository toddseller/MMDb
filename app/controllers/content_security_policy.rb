# Report-only until the logged reports show nothing an enforced policy would break.
after do
  headers 'content-security-policy-report-only' => [
    "default-src 'self'",
    # Cloudflare injects its Web Analytics beacon into pages, and it reports back to cloudflareinsights.com.
    # The import map is the one inline script; its text changes only when a module does.
    "script-src 'self' https://static.cloudflareinsights.com 'sha256-#{Digest::SHA256.base64digest(import_map)}'",
    "style-src 'self'",
    # Posters come from whatever host a pasted URL names.
    "img-src 'self' https: data:",
    "connect-src 'self' https://cloudflareinsights.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    'report-uri /csp-reports'
  ].join('; ')
end

CSP_REPORT_LIMIT = 8 * 1024

# Browsers post these without cookies, so anyone can; the size cap and one-line format bound what that can write.
post '/csp-reports' do
  body = request.body.read(CSP_REPORT_LIMIT + 1).to_s
  halt 400 if body.bytesize > CSP_REPORT_LIMIT
  parsed = JSON.parse(body)
  report = parsed['csp-report'] if parsed.is_a?(Hash)
  halt 400 unless report.is_a?(Hash)

  # Query strings can carry tokens, and control characters could start a fake log line.
  field = ->(value) { value.to_s.split('?').first.to_s.gsub(/[[:cntrl:]]/, '') }
  directive = field.(report['effective-directive'] || report['violated-directive'])
  page = field.(report['document-uri']).sub(%r{\Ahttps?://[^/]+}, '')
  puts "CSP #{directive} blocked #{field.(report['blocked-uri'])} on #{page}"
  status 204
rescue JSON::ParserError
  halt 400
end

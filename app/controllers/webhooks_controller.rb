namespace '/v1/webhooks' do

  # Plex can't sign webhooks or add headers, so the secret travels in the URL as ?token=;
  # the WebhookToken middleware in config.ru moves it out of the query string before logging.
  before do
    content_type 'application/json'
    secret = ENV['PLEX_WEBHOOK_SECRET'].to_s
    halt 401 if secret.empty? || !Rack::Utils.secure_compare(secret, env['mmdb.webhook_token'].to_s)
  end

  helpers do
    # Rack turns a payload part with a filename into an uploaded-file Hash, and JSONBodyParser has
    # already consumed a JSON body (production's input can't rewind), so read whichever form arrived.
    def plex_event
      payload = request.params['payload']
      payload = payload[:tempfile].read if payload.is_a?(Hash) && payload[:tempfile]
      event = payload.is_a?(String) ? JSON.parse(payload) : request.POST
      halt 400 unless event.is_a?(Hash) && event['event']
      event
    rescue JSON::ParserError
      halt 400
    end
  end

  post '/new' do
    status 204
    payload = plex_event

    if payload['Account']['title'] == ENV['PLEX_USER']
      if payload['event'] == 'library.new'
        case payload['Metadata']['librarySectionType']
        when 'show'
          p '****** Show'
          Show.plex_add(payload['Metadata'], ENV['PLEX_USER_ID'])
        when 'movie'
          p '****** Movie'
          Movie.plex_add(payload['Metadata'], ENV['PLEX_USER_ID'])
        else
          p '****** Unknown'
        end
      end
    end
  end

end
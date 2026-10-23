namespace '/v1/webhooks' do

  # Plex can't sign webhooks or add headers, so the secret travels in the URL as ?token=.
  before do
    content_type 'application/json'
    secret = ENV['PLEX_WEBHOOK_SECRET'].to_s
    halt 401 if secret.empty? || !Rack::Utils.secure_compare(secret, params[:token].to_s)
  end

  post '/new' do
    status 204

    if request.params['payload']
      payload = JSON.parse(request.params['payload'])
    else
      payload = JSON.parse(request.body.read)
    end

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
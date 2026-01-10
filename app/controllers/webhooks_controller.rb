namespace '/v1/webhooks' do

  before do
    content_type 'application/json'
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
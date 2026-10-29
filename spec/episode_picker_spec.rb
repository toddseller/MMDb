describe 'the episode picker after picking a season' do
  let(:user) { create_user }
  let(:episodes) do
    [{ title: 'Apple', tv_episode: 1, preview: 'https://is1-ssl.mzstatic.com/image/thumb/Video221/v4/cd/PreviewImage_preview_image_397000_video_sdr/300x169.jpg' },
     { title: 'Still', tv_episode: 2, preview: 'https://image.tmdb.org/t/p/original/still.jpg' },
     { title: 'Bare', tv_episode: 3, preview: '' }]
  end

  let(:picker) do
    allow(Show).to receive(:get_episodes).and_return(episodes)
    log_in(user, 'secret-password')
    response = post("/users/#{user.id}/shows",
                    params: { show: { title: 'Harbor Lights', year: '2024', show_collection_id: 'tmdb123' },
                              season: { collectionName: 'Harbor Lights', season: '1', collectionId: 'tmdb123-1', poster: 'https://image.tmdb.org/p.jpg' } })
    Nokogiri::HTML(JSON.parse(response.body)['page'])
  end

  # Apple names some preview images "..._video_sdr...", which once sent them to a <video> that can't show a JPEG.
  it 'shows every preview as an image with the fallback' do
    images = picker.css('#episode-video img')
    expect(images.map { |img| img['src'] }).to eq episodes.map { |episode| episode[:preview] }
    expect(images.map { |img| img['data-fallback'] }).to all be_present
    expect(picker.css('video')).to be_empty
  end

  it 'offers every episode to Add All Episodes' do
    expect(picker.css('input[name="episodes[][title]"]').map { |input| input['value'] }).to eq %w[Apple Still Bare]
  end
end

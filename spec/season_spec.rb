describe Season do
  let(:season) { create_show(create_user, seasons: [1]).seasons.first }
  let(:stored) { season.episodes.first }

  describe '#add_episode' do
    it 'adds a new episode' do
      episode = season.add_episode(title: 'Second', tv_episode: 2, plot: 'Plot', runtime: '42')

      expect([episode.reload.title, episode.plot, episode.runtime, episode.season_id]).to eq ['Second', 'Plot', '42 min', season.id]
    end

    it 'fills a stored episode’s blank plot and runtime' do
      stored.update_column(:runtime, nil)

      season.add_episode(title: 'Other', tv_episode: 1, plot: 'Plot', runtime: '42')

      expect([stored.reload.plot, stored.runtime]).to eq ['Plot', '42 min']
    end

    it 'fills a runtime stored as 0 min' do
      expect(stored.runtime).to eq '0 min'

      season.add_episode(tv_episode: 1, runtime: '42')

      expect(stored.reload.runtime).to eq '42 min'
    end

    it 'keeps the values a stored episode already has' do
      stored.update!(title: 'Hand edit', plot: 'Edited plot', runtime: '1h 5m')

      season.add_episode(title: 'Other', tv_episode: 1, plot: 'Other plot', runtime: '30')

      expect([stored.reload.title, stored.plot, stored.runtime]).to eq ['Hand edit', 'Edited plot', '1h 5m']
    end

    it 'ignores a blank incoming value' do
      stored.update!(plot: 'Plot')

      season.add_episode(tv_episode: 1, plot: '')

      expect(stored.reload.plot).to eq 'Plot'
    end

    it 'keeps a blank or 0 min value when the incoming one is empty' do
      season.add_episode(tv_episode: 1, runtime: '', plot: '')

      expect([stored.reload.runtime, stored.plot]).to eq ['0 min', nil]
    end

    it 'adds no second episode with the same number' do
      season.add_episode(title: 'Again', tv_episode: '1')

      expect(season.episodes.count).to eq 1
    end
  end
end

describe Match do
  describe '.same_name?' do
    it 'ignores case and the curly apostrophe' do
      expect(Match.same_name?('Lupin’s Tales', "lupin's tales")).to be true
    end

    it 'tells different titles apart' do
      expect(Match.same_name?('Rocky', 'Rocky II')).to be false
    end
  end

  describe '.same_year?' do
    it 'allows one year apart' do
      expect(Match.same_year?('1976', '1977')).to be true
    end

    it 'rejects two years apart' do
      expect(Match.same_year?('1976', '1978')).to be false
    end
  end

  describe '.same_director?' do
    it 'ignores a trailing non-breaking space' do
      expect(Match.same_director?("John G. Avildsen ", 'John G. Avildsen')).to be true
    end

    it 'matches on the last name' do
      expect(Match.same_director?('John G. Avildsen', 'John Avildsen')).to be true
    end

    it 'treats a blank director on either side as a match' do
      expect(Match.same_director?('', 'Martin Kellerman')).to be true
      expect(Match.same_director?('Martin Kellerman', nil)).to be true
      expect(Match.same_director?(" ", 'Martin Kellerman')).to be true
    end

    it 'tells different directors apart' do
      expect(Match.same_director?('Martin Kellerman', 'S. K. Nagendra Urs')).to be false
    end
  end
end

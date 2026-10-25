describe RailLetter, '.of' do
  it 'files a sort name under its first letter, lowercase' do
    expect(RailLetter.of('matrix')).to eq 'm'
    expect(RailLetter.of('Picard')).to eq 'p'
  end

  it 'files an accented letter under its plain letter, where the database sorts it' do
    expect(RailLetter.of('élan')).to eq 'e'
    expect(RailLetter.of('Ørsted')).to eq 'o'
    expect(RailLetter.of('Æon flux')).to eq 'a'
  end

  it 'files digits and missing names under #' do
    expect(RailLetter.of('12 angry men')).to eq '#'
    expect(RailLetter.of('')).to eq '#'
    expect(RailLetter.of(nil)).to eq '#'
  end
end

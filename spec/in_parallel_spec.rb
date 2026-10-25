describe InParallel, '.map' do
  it 'returns results in input order' do
    results = InParallel.map([3, 1, 2]) do |n|
      sleep(n * 0.01)
      n * 10
    end

    expect(results).to eq [30, 10, 20]
  end

  it 'runs at most the limit at once, and more than one when allowed' do
    running = peak = 0
    lock = Mutex.new
    InParallel.map((1..12).to_a, limit: 4) do
      lock.synchronize { peak = [peak, running += 1].max }
      sleep 0.02
      lock.synchronize { running -= 1 }
    end

    expect(peak).to eq 4
  end

  it 'gives nil for an item that raises and finishes the rest' do
    results = nil
    expect { results = InParallel.map([1, 2, 3]) { |n| n == 2 ? raise(ArgumentError, 'bad item') : n } }
      .to output("in_parallel: ArgumentError: bad item\n").to_stdout

    expect(results).to eq [1, nil, 3]
  end
end

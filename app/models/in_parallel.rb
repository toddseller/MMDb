module InParallel
  # Net::HTTP releases Ruby's lock while waiting, so threads overlap the slow Apple and TMDB calls.
  # Keep ActiveRecord out of the block: each thread would check out its own connection.
  def self.map(items, limit: 8)
    queue = Queue.new
    items.each_with_index { |item, index| queue << [item, index] }
    results = Array.new(items.size)
    Array.new([limit, items.size].min) do
      Thread.new do
        while (job = queue.pop(true) rescue nil)
          item, index = job
          begin
            results[index] = yield(item)
          rescue => e
            puts "in_parallel: #{e.class}: #{e.message}"
          end
        end
      end
    end.each(&:join)
    results
  end
end

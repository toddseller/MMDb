module Match
  # Apple and TMDB often date the same title a year apart (the UK Office: 2001 on TMDB, 2002 on Apple).
  def self.same_year?(a, b)
    (a.to_i - b.to_i).abs <= 1
  end

  # Apple spells some titles with a curly apostrophe where TMDB uses a straight one (Lupin’s Tales).
  def self.same_name?(a, b)
    a.downcase.tr('‘’', "''") == b.downcase.tr('‘’', "''")
  end

  # Apple pads some names with a non-breaking space, which plain split and strip keep.
  # A source that lists no director can't tell two films apart, so blank matches anyone.
  def self.same_director?(a, b)
    a_last, b_last = [a, b].map { |director| director.to_s.split(/[[:space:]]+/).last }
    a_last.nil? || b_last.nil? || a_last == b_last
  end
end

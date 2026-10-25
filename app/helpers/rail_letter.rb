# The letter rail files each tile by its sort name, which a show's edit dialog saves as typed, so case varies.
# The database's collation sorts É among the Es, so accents are dropped to keep each letter's first tile in place.
module RailLetter
  def self.of(sort_name)
    letter = sort_name.to_s[0, 1]
    letter = ActiveSupport::Inflector.transliterate(letter) unless letter.ascii_only?
    letter = letter.downcase[0]
    letter&.match?(/[a-z]/) ? letter : '#'
  end
end

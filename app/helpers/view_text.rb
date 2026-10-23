# Used by Erubi as the escape function for every <%= %> (see config.ru). Stored text often holds
# HTML entities such as &amp;, so decode first or they would display literally.
module ViewText
  DECODER = HTMLEntities.new

  def self.escape(value)
    Rack::Utils.escape_html(DECODER.decode(value.to_s))
  end
end

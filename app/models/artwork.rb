module Artwork
  CDN = 'https://cdn.myflix.stream/'
  MAX_BYTES = 5 * 1024 * 1024
  TYPES = { "\xFF\xD8\xFF".b => ['jpg', 'image/jpeg'], "\x89PNG\r\n\x1A\n".b => ['png', 'image/png'] }

  class Invalid < StandardError; end
  class StoreFailed < StandardError; end

  def self.store(file)
    raise Invalid, 'Choose a JPEG or PNG file to upload.' unless file
    raise Invalid, 'Artwork must be 5 MB or smaller.' if file.size > MAX_BYTES

    # The browser's file name and declared type are whatever the sender says, so trust only the bytes.
    head = file.read(8).to_s.b
    file.rewind
    extension, content_type = TYPES.find { |magic, _| head.start_with?(magic) }&.last
    raise Invalid, 'Only JPEG and PNG files are accepted.' unless extension

    key = "images/#{SecureRandom.alphanumeric(27)}.#{extension}"
    Aws::S3::Client.new.put_object(bucket: ENV['ARTWORK_BUCKET'], key: key, body: file, content_type: content_type)
    CDN + key
  rescue Aws::Errors::ServiceError, Aws::Errors::MissingCredentialsError, Seahorse::Client::NetworkingError => e
    # The SDK's message can echo request details, so only the class reaches the log.
    warn "artwork upload failed: #{e.class}"
    raise StoreFailed
  end
end

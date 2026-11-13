FROM ruby:3.4.12@sha256:5803b69dd8a875a9afc7e3bbc10d0ba683e12aad2640dbbd44295b4890cc8927

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev

RUN mkdir -p /app
WORKDIR /app

COPY Gemfile* /app/
RUN bundle install

COPY . /app

EXPOSE 4666

CMD ["bash"]
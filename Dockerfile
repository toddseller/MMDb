FROM ruby:3.4.12@sha256:27125a2b30782f1ec4230d3aaf545d5b167e8beb11da4a11ff5ceeb8cb44a36c

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev

RUN mkdir -p /app
WORKDIR /app

COPY Gemfile* /app/
RUN bundle install

COPY . /app

EXPOSE 4666

CMD ["bash"]
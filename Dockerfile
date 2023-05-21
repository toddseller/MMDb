FROM ruby:2.6.7

RUN apt-get update -qq && apt-get install -y build-essential
ENV TAUTULLI_KEY 5466f53fef0c47a2bad02cede4f40cbb

RUN mkdir -p /app
WORKDIR /app

ADD . /Sinatra-Docker
COPY Gemfile* /app
RUN gem install bundler:2.2.19
RUN bundle install

COPY . /app

EXPOSE 4666

CMD ["bash"]
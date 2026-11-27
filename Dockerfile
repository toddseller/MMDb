FROM ruby:3.4.12@sha256:09e55ffd89bacb59398d260e49450ed30627276672358a27ccea7641f96595be

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev

RUN mkdir -p /app
WORKDIR /app

COPY Gemfile* /app/
RUN bundle install

COPY . /app

EXPOSE 4666

CMD ["bash"]
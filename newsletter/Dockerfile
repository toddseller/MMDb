FROM node:24.22.3-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src

# uid 1000, the same as onyx's user, so the job can write to the mounted issues folder.
USER node

CMD ["node_modules/.bin/tsx", "src/main.ts"]

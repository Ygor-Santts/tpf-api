FROM node:20-bookworm-slim

WORKDIR /usr/src

COPY package.json package-lock.json ./

# Dev dependencies stay in the image: migrations and the seed run with ts-node.
RUN npm ci --no-fund --no-audit --loglevel=error

COPY . .

RUN npm run build

EXPOSE 3000

# Applies pending migrations, then starts the compiled API.
# docker-compose.yml (local dev) overrides this with `npm run dev`.
CMD ["sh", "-c", "npm run migration:up && npm run start:prod"]

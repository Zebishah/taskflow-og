# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.23.1

FROM node:${NODE_VERSION}-bookworm-slim AS base

WORKDIR /app


# Install all dependencies and compile the application.
FROM base AS build

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci

COPY apps/api ./apps/api

RUN npm run build --workspace=@taskflow/api


# This optional stage will run Drizzle migrations once.
# We will use it through Docker Compose in Phase 3.
FROM build AS migration

WORKDIR /app/apps/api

CMD ["npm", "run", "db:migrate"]


# Install only dependencies required at runtime.
FROM base AS production-dependencies

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci \
      --omit=dev \
      --workspace=@taskflow/api \
    && npm cache clean --force


# Final image used by both the API and worker containers.
FROM base AS runtime

ENV NODE_ENV=production

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
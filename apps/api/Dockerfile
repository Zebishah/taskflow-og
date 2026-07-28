# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.23.1

FROM node:${NODE_VERSION}-bookworm-slim AS base

WORKDIR /app


# Install all dependencies and compile TaskFlow.
FROM base AS build

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci

COPY apps/api ./apps/api

RUN npm run build --workspace=@taskflow/api


# Install only production dependencies.
FROM base AS production-dependencies

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci \
      --omit=dev \
      --workspace=@taskflow/api \
    && npm cache clean --force


# One compact image used by the API, worker, and migration job.
FROM base AS runtime

ARG SOURCE_REPOSITORY=https://github.com/Zebishah/taskflow-og

ENV NODE_ENV=production

LABEL org.opencontainers.image.source="${SOURCE_REPOSITORY}"
LABEL org.opencontainers.image.description="TaskFlow API, BullMQ worker, and migration runner"

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/drizzle ./apps/api/drizzle

WORKDIR /app/apps/api

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]

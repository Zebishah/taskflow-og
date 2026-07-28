# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci

COPY apps/api ./apps/api

RUN npm run build --workspace=@taskflow/api


FROM node:22-bookworm-slim AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

# Keep the verified dependencies from the build stage initially.
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

USER node

CMD ["node", "dist/main.js"]
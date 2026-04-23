# syntax=docker/dockerfile:1.6
# Build context for this Dockerfile must be the monorepo ROOT, not apps/api/.
#   docker build -f apps/api/Dockerfile -t nis-api .

# ---- Stage 1: builder --------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /repo

RUN apk add --no-cache python3 make g++

# Workspace manifests for proper dep resolution
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm ci -w @nis/api --include-workspace-root

# Source
COPY packages/shared packages/shared
COPY apps/api/tsconfig*.json apps/api/nest-cli.json apps/api/
COPY apps/api/src apps/api/src

RUN npm run build -w @nis/shared \
 && npm run build -w @nis/api \
 && npm prune --omit=dev --include-workspace-root

# ---- Stage 2: runtime --------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production NPM_CONFIG_UPDATE_NOTIFIER=false

RUN apk add --no-cache curl tini

COPY --chown=node:node --from=builder /repo/node_modules ./node_modules
COPY --chown=node:node --from=builder /repo/apps/api/node_modules ./apps/api/node_modules
COPY --chown=node:node --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=builder /repo/apps/api/package.json ./apps/api/
COPY --chown=node:node --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=builder /repo/packages/shared/package.json ./packages/shared/

USER node
WORKDIR /app/apps/api
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]

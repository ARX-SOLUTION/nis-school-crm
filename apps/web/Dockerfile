# syntax=docker/dockerfile:1.6

# ---- Stage 1: builder --------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /repo

# Workspaces require the root manifest + every package manifest to install fully.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci -w @nis/web --include-workspace-root

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build -w @nis/shared && npm run build -w @nis/web

# ---- Stage 2: runtime (nginx-unprivileged runs as user 101) ------------------
FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

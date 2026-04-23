# ADR 003 — Use Caddy instead of Nginx as the reverse proxy

**Status:** Accepted
**Date:** 2026-04-23

## Context

The production stack needs a reverse proxy that:

- Terminates HTTPS with valid certificates on a single Linux VPS.
- Routes `/api/*` to the NestJS container and everything else to the React SPA
  container.
- Sets security headers (HSTS, CSP, X-Frame-Options, Referrer-Policy,
  Permissions-Policy).
- Handles the Telegram webhook path (`/telegram/webhook`).
- Is maintainable by a small team without a dedicated ops engineer.

Two candidates were evaluated: **Nginx** (the de-facto default) and **Caddy 2**.

## Decision

Use **Caddy 2** (`caddy:2-alpine` Docker image).

## Reasoning

### Automatic HTTPS (ACME/Let's Encrypt)

Caddy provisions and renews TLS certificates automatically from Let's Encrypt using
the ACME protocol. The only configuration needed is the domain name in the
`Caddyfile`:

```
{$PUBLIC_HOST} {
  ...
}
```

With Nginx, certificate management requires a separate tool (Certbot or
`acme.sh`), a cron/systemd timer for renewal, and hooks to reload Nginx after
renewal. On a single VPS, that is three moving parts where Caddy provides one.

### Configuration simplicity

The entire production proxy configuration fits in `deploy/Caddyfile` (~65 lines
including comments and security headers). The equivalent Nginx configuration would
require separate `server` blocks for HTTP→HTTPS redirect, the HTTPS vhost, upstream
definitions, and proxy header settings.

The Caddyfile is declarative and easier to audit:

```
handle /api/* {
  reverse_proxy api:3000
}
handle {
  reverse_proxy web:8080
}
```

### HTTP/2 and HTTP/3 out of the box

Caddy enables HTTP/2 on all HTTPS sites by default. HTTP/3 (QUIC) is also supported
without configuration changes. Nginx requires a separate build flag for HTTP/3 and
until recently required a third-party patch.

### Single static binary

The `caddy:2-alpine` image is ~50 MB and ships a single statically linked binary
with no dependency on OpenSSL or libssl. This reduces the attack surface and
eliminates the class of "OpenSSL version mismatch" issues seen in long-running Nginx
deployments.

### When Nginx would be the better choice

Nginx has a larger ecosystem, more fine-grained buffering and connection tuning,
lua scripting support, and is the standard choice for high-traffic multi-server
deployments (CDN edge, large API gateways). For a single-VPS CRM serving a school
with < 500 concurrent users, none of those advantages are relevant.

## Consequences

**Positive**
- Certificate provisioning and renewal are fully automatic. The operator never
  touches `certbot` or cron.
- Security headers are configured once in `deploy/Caddyfile` and apply to all routes.
- HTTP/2 is enabled without extra configuration.
- The production `docker-compose.prod.yml` exposes only ports 80 and 443; all
  internal services are on the `nis-net` bridge network and not reachable directly.

**Negative**
- Caddy is less familiar to engineers who have worked primarily with Nginx.
  The `Caddyfile` syntax is distinct from `nginx.conf`.
- Advanced load-balancing features (e.g., active health checks, consistent hashing)
  require Caddy Enterprise. The open-source edition is sufficient for MVP but
  would be a constraint if the deployment expanded to multiple API nodes.
- Some existing runbooks and StackOverflow answers assume Nginx; the team must
  translate them to Caddyfile syntax.

**Neutral**
- The health check endpoint (`:80 /caddy-health`) is separate from the HTTPS
  vhost so external load balancers can probe Caddy liveness without a certificate.
- The `admin off` directive in the global Caddyfile block disables the Caddy admin
  API on `:2019` to reduce the attack surface in production.

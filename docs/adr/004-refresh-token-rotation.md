# ADR 004 — Refresh token design: opaque rotation with family reuse detection

**Status:** Accepted
**Date:** 2026-04-23

## Context

The API issues short-lived JWT access tokens (15 min). To avoid forcing users to
re-authenticate every 15 minutes, a refresh mechanism is needed. The design must
address:

1. **Theft detection.** A stolen refresh token should be detectable and mitigated.
2. **Storage safety.** The raw token must not be recoverable from a DB dump.
3. **Cookie vs response body.** Where should the refresh token live on the client?
4. **Rotation atomicity.** Issuing a new token and revoking the old one must not
   leave the system in an inconsistent state after a partial failure.

## Decision

### Token format and storage

The refresh token is a **48-byte cryptographically random value** encoded as
`base64url` (64 characters, no padding). It is generated with Node.js
`crypto.randomBytes(48)`.

The raw token is returned to the client **once** at issue time and never stored
again. The database stores only the **SHA-256 hex digest** (64 hex chars) in the
`token_hash` column with a unique index.

A lookup on `POST /auth/refresh` hashes the presented token and queries
`WHERE token_hash = $1`. The raw token is unrecoverable from a DB dump.

### Family-based reuse detection

Every refresh token belongs to a **family** (a UUID). All tokens issued from the
same login share a `family_id`. When the server rotates a token it:

1. Issues a new token with the same `family_id`.
2. Marks the old token `revoked = true`.

If a **revoked** token from a known family is presented, it means either:
- The client replayed an old token (client-side bug), or
- The token was stolen and the legitimate client has already used the next token in
  the rotation chain, causing the attacker to present the burned one.

In both cases the correct response is to **revoke every token in that family**
(`UPDATE refresh_tokens SET revoked = true WHERE family_id = $1`). This forces the
user to log in again with their password. See `RefreshTokenService.consume` and
`RefreshTokenService.revokeFamily`.

### Atomic rotation

Issuing a new token and revoking the old one are wrapped in a single
`DataSource.transaction` call in `RefreshTokenService.rotate`. A crash between the
two writes would otherwise leave both tokens valid simultaneously, which would break
reuse detection (the revoked token would never appear in the DB and the old token
would remain usable).

### Cookie vs response body

The raw refresh token is returned in the JSON response body, not in an HTTP cookie.
The client (a Vite + React SPA) stores it in memory and sends it in the
`Authorization: Bearer` header on `POST /auth/refresh`.

**Tradeoffs:**

| | HttpOnly cookie | Response body (chosen) |
|---|---|---|
| XSS exposure | Low (JS cannot read it) | Higher: JS can read the token; mitigated by keeping it in memory, not `localStorage` |
| CSRF exposure | Higher (browser attaches automatically) | Zero (must be explicitly sent) |
| Multi-tab support | Automatic (browser shares cookies) | Requires coordination in the SPA; TanStack Query handles this |
| SSR / native clients | Requires `SameSite` tuning | Uniform: all clients use the same Authorization header pattern |

The SPA never stores the refresh token in `localStorage` or `sessionStorage`.
It is held in a React/Zustand store in memory; a page reload requires re-login, which
is acceptable for this audience (school staff, not consumers).

The response-body approach was chosen because:
- The frontend is a pure SPA with no SSR; cookie `SameSite` semantics add complexity
  without benefit.
- Explicit header sending eliminates CSRF concerns on the refresh endpoint.
- The client contract is uniform across the web app and any future mobile/API clients.

## Consequences

**Positive**
- A single stolen refresh token gives an attacker at most one successful use before
  reuse detection triggers a full family revocation.
- DB compromise does not expose raw tokens (only SHA-256 hashes).
- Rotation is atomic; no window exists where both old and new tokens are valid
  simultaneously.
- No CSRF risk on the refresh endpoint.

**Negative**
- Page reload logs the user out (token is in memory only). Acceptable for the
  target audience.
- SHA-256 is not a password KDF (no salt, fast to brute-force with a GPU if a
  short/guessable token were used). Mitigated by the 48-byte random token: the
  preimage space is 2^384, making brute force impractical.
- If the server crashes after issuing the new token but before the transaction
  commits, the client holds a token that has no DB record. The client will get
  `401 Invalid refresh token` and be forced to re-login. This is rare and
  acceptable.

**Neutral**
- Expired tokens are cleaned up by `RefreshTokenService.purgeExpired` (runs on a
  schedule). The cutoff is 7 days after the token's `expiresAt`, giving a grace
  window for audit queries before hard deletion.
- The `replaced_by` column on `RefreshToken` records the UUID of the successor
  token, enabling a forensic chain of custody.

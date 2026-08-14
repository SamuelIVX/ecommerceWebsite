# Spec: ecommerceWebsite — Cookie Unification (anon visitor → member handoff)

## Objective

Fix the anonymous-visitor auth handoff in ecommerceWebsite by standardizing the Wix refresh-token cookie name on the singular `refreshToken` everywhere. Today `src/middleware.ts` writes/checks a plural `refreshTokens` cookie that no consumer reads, so anon visitors never get the token the client/server clients expect; the shared constant + middleware fix restores the handoff with one regression test.

## Scope

- Package: ecommerceWebsite (local checkout `~/Documents/projects/ecommerce`)
- Modifies:
  - `src/middleware.ts` — write/check singular `refreshToken` via shared constant
  - `src/context/wixContext.tsx`, `src/lib/wixClientServer.ts`, `src/app/login/page.tsx`, `src/components/NavIcons.tsx` — read/set/remove via shared constant
  - New `src/lib/authCookies.ts` — the one shared cookie-name constant
  - New `src/middleware.test.ts` — regression test for the anon handoff
- Off-limits: no change to member login flow, Wix OAuth strategy config, token shapes, `maxAge`/`expires` values, or any non-cookie code.

## Non-Goals

- No change to Wix SDK usage, `OAuthStrategy` config, or token payload shapes (`{ value, role }` round-trips unchanged).
- No change to cookie expiry/lifetimes (visitor 30d via `maxAge`, member 2d via `expires` are intentional and differ by intent — do not unify).
- No change to the `Filter.tsx` `cat` placeholder bug or any other pre-existing issue (separate work, documented in context).
- **No GTM/vendor file deletion:** the master plan's "aztec / web-contact / web-elements blocks + page-set overhaul" claim is **stale** — those files do not exist in this checkout or in git history (verified `git ls-files`, full-tree grep, and `git log --diff-filter=D`). Logged as a scope deviation; not executed.
- No behavior change beyond the cookie name; anon handoff becomes *correct* rather than *different*.

## Invariants

- The Wix refresh token always crosses the cookie boundary as `JSON.stringify({ value, role })` and is read back with `JSON.parse(... || "{}")` — the serialized shape must not change.
- Member login (singular `refreshToken`) must keep working exactly as it does today.
- Exactly one source of truth for the cookie name string: the shared constant in `src/lib/authCookies.ts`. No literal `"refreshToken"`/`"refreshTokens"` strings may remain in any other **production** file; the exception is the literal asserted in regression tests (they must pin the exact cookie name the clients read).
- The middleware must not mint/overwrite a token when the (singular) cookie is already present.

## Error behavior

- The middleware's `generateVisitorTokens()` call is currently unguarded (no try/catch) — if the Wix call rejects, the middleware rejects and the request fails. This is **existing behavior**; this spec does not add or remove error handling around it.

## Requirements

1. WHEN the app needs the Wix refresh-token cookie name, THE SYSTEM SHALL use the single shared constant `REFRESH_TOKEN_COOKIE = "refreshToken"` exported from `src/lib/authCookies.ts` (no duplicated literals).
2. WHEN `src/middleware.ts` checks for or sets the visitor token cookie, THE SYSTEM SHALL use `REFRESH_TOKEN_COOKIE` (singular) so the minted token is readable by the client/server clients.
3. WHEN an anonymous visitor first hits the app with no refresh-token cookie, THE SYSTEM SHALL mint visitor tokens and set the cookie named exactly `refreshToken`.
4. WHEN the (singular) refresh-token cookie is already present, THE SYSTEM SHALL pass the request through without re-minting.
5. WHEN any reader (`wixContext`, `wixClientServer`, `login`, `NavIcons`) reads/sets/removes the cookie, THE SYSTEM SHALL reference `REFRESH_TOKEN_COOKIE` rather than a literal.

## Acceptance Criteria

1. `grep -rn '"refreshTokens"' src/` returns nothing; `grep -rn '"refreshToken"' src/` matches only `src/lib/authCookies.ts` (the constant definition) and the regression test's assertion of the literal value. (R1, R2, R5)
2. `src/middleware.ts` imports `REFRESH_TOKEN_COOKIE` and uses it for both the `cookies.get` guard and `res.cookies.set`. (R2, R3, R4)
3. All four reader files import `REFRESH_TOKEN_COOKIE` from `src/lib/authCookies.ts`. (R5)
4. New regression test `middleware.test.ts`: with the cookie absent, calling `middleware()` mints visitor tokens (mocked `@wix/sdk`) and the returned response sets a cookie named exactly `refreshToken` with value `JSON.stringify({ value, role })`. (R3)
5. Same test file: with the cookie present, `middleware()` returns `NextResponse.next()` without calling `generateVisitorTokens`. (R4)
6. Existing suite (16 tests) stays green; lint, `tsc --noEmit`, and `next build` pass with no new errors. (all)

## Design

New module `src/lib/authCookies.ts`:

```ts
/** Single source of truth for the Wix refresh-token cookie name. */
export const REFRESH_TOKEN_COOKIE = "refreshToken";
```

Edits:

- `src/middleware.ts`: import the constant; replace `"refreshTokens"` at the `cookies.get` guard and the `res.cookies.set` call; update the header/jsdoc comments that describe the mismatch.
- `src/context/wixContext.tsx`: `Cookies.get(REFRESH_TOKEN_COOKIE)`.
- `src/lib/wixClientServer.ts`: `cookieStore.get(REFRESH_TOKEN_COOKIE)`.
- `src/app/login/page.tsx`: `Cookies.set(REFRESH_TOKEN_COOKIE, ...)`.
- `src/components/NavIcons.tsx`: `Cookies.remove(REFRESH_TOKEN_COOKIE)`.

Regression test `src/middleware.test.ts` mocks `@wix/sdk` (`createClient` → `auth.generateVisitorTokens`) and `next/server` (`NextRequest`, `NextResponse`) to exercise the real `middleware` function:

- absent cookie → asserts `set` called with `name === "refreshToken"` and the serialized `{ value, role }` payload;
- present cookie → asserts passthrough, no token generation.

## Current State

- `src/middleware.ts:25,34` — writes/checks `"refreshTokens"` (plural). (verified)
- `src/context/wixContext.tsx:14`, `src/lib/wixClientServer.ts:23`, `src/app/login/page.tsx:110`, `src/components/NavIcons.tsx:45` — all use `"refreshToken"` (singular). (verified)
- `@wix/sdk` `OAuthStrategy` takes tokens via `tokens`/`tokenStorage` config — no hardcoded cookie name; the name is app-chosen. (verified in `node_modules/@wix/sdk/build/auth/oauth2/OAuthStrategy.d.ts` on v1.21.15)
- Member login (singular) works end-to-end today; anon visitor handoff is broken. (verified)
- No GTM/vendor/page-set files exist in checkout or history. (verified)
- Baseline: 16 tests pass (3 files); lint clean; `tsc --noEmit` clean; `next build` clean (env present). (recorded 2026-08-13)

## Tests

- `middleware.test.ts` — mints visitor cookie under singular name when absent (R3 / AC4); passes through without minting when present (R4 / AC5).
- Existing `useCartStore`, `CartModel`, `a11y` suites must remain green (no deletions).

## Constraints

- Dependencies: none (ecommerceWebsite is the current Tier B repo; no spec gates).
- Backward compatibility: cookie name is app-internal — no external contract. Member login path unchanged. Token payload shape unchanged. Cookie lifetimes unchanged.
- Follow `docs/specs` in-repo convention (D6/D7 of master-refactor-v3).

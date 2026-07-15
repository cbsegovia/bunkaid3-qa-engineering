# Tenancy & Identity (EPIC-BK-1) - Module Context

**Last Updated:** 2026-06-23
**Stories Tested:** 1 (BK-166)

---

## Overview

**Description:** Authentication and multi-tenant identity for Bunkai TMS. Covers how a user proves who they are (magic-link OTP, email+password, headless API signin/signup), how that identity carries a session (cookie) or a long-lived Bearer token (PAT), and how workspace membership scopes data access via RLS.

**Business Domain:** Authentication / Tenancy / Identity

**Primary Actors:** Browser user (Sara — Full-Stack Developer signing in via the login screen), API/CLI consumer (Karim — automation/agent using email+password + PAT), Senior QA Engineer (workspace/project owner).

---

## Routes (Frontend)

| Route | Path | Description |
|-------|------|-------------|
| Login page | `app/(auth)/login/page.tsx` | Server component. Redirects signed-in users to `/projects`. Renders `EmailFirstForm` (primary) + `MagicLinkDisclosure` (secondary fallback) + disabled OAuth buttons. |
| Email-first form | `app/(auth)/login/email-first-form.tsx` | Client component, 4-step state machine: `email -> password \| create -> verify`. Drives `check-email`, `signin`, `signup`, `confirm` fetch calls. |
| Magic-link disclosure | `app/(auth)/login/magic-link-disclosure.tsx` | Collapsed-by-default toggle revealing the pre-existing `MagicLinkForm` (BK-2). Keeps password primary per BK-166 AC #9. |
| Magic-link form | `app/(auth)/login/magic-link-form.tsx` | Pre-existing (BK-2) OTP email-link form. Not modified by BK-166. |
| Auth callback | `app/auth/callback/*` (not re-read this session; pre-existing from BK-2) | OTP exchange + session hydration for the magic-link flow only. Not used by the password rail. |

---

## State Management (Frontend)

| State File | Path | Purpose |
|------------|------|---------|
| `EmailFirstForm` local state | `app/(auth)/login/email-first-form.tsx` | `step` (`email\|password\|create\|verify`), `email`, `password`, `code`, `submitting`, `error`, `accountConfirmed`. No global store — fully local `useState`. `accountConfirmed` (set from `check-email`'s `confirmed` field) is what lets a `signin` 401 be reinterpreted as "go verify" instead of "wrong password" (Decision #1 in code comments). |

---

## API Endpoints

| Endpoint | Method | Controller/Handler | Purpose |
|----------|--------|-------------------|---------|
| `/api/v1/auth/check-email` | POST | `app/api/v1/auth/check-email/route.ts` | Email-first routing helper (BK-166). Returns `{ exists, confirmed }` via `public.auth_email_status` SECURITY DEFINER RPC (service-role only, bypasses GoTrue). Deliberate enumeration tradeoff per ADR-0007 — mitigation is an app-level rate limiter, NOT YET SHIPPED (confirmed: no rate-limit middleware found under `lib/api/`; only upstream Supabase 429s are surfaced). |
| `/api/v1/auth/signup` | POST | `app/api/v1/auth/signup/route.ts` | Verification-first signup (BK-166). Calls public `auth.signUp` — triggers 6-digit email OTP. NO auto-confirm, NO session, NO PAT minted here (closes prior auto-confirm backdoor). Password min 8 chars. Returns 202 `{ status: 'pending_confirmation', email }`. 409 if email already exists (handles both the explicit Supabase error path AND the silent `identities: []` obfuscated-200 path — does not echo email back in either case). |
| `/api/v1/auth/signin` | POST | `app/api/v1/auth/signin/route.ts` | Email+password signin + PAT mint in one call (BK-166). Password min 6 (intentionally asymmetric vs signup's min 8 — comment: "pre-policy legacy passwords still work"). Uniform 401 on bad email OR bad password (no enumeration leak). Mints PAT with `DEFAULT_PAT_SCOPES` (`atc:read`, `atc:write`, `run:execute`) unless caller supplies `pat_scopes` — `workspace:admin` is rejected via `assertNoGlobalAdminScope` (ADR-0005/BK-135). |
| `/api/v1/auth/confirm` | POST | `app/api/v1/auth/confirm/route.ts` | Completes signup via `auth.verifyOtp({ type: 'signup' })`. Token regex `^\d{6,8}$` (6-8 digits — comments.md says "6-8 digit"; AC text says "6-digit" — actual code accepts up to 8). On success: session cookies set + PAT minted, response shape identical to signin's `{ user, session, pat, warning }`. Uniform 401 on wrong/expired/no-pending-signup code. Upstream 429 mapped to `rate_limited`. |
| `/api/v1/auth/magic-link` | POST | (pre-existing, BK-2, not re-read this session) | Passwordless OTP email login. Untouched by BK-166; still reachable via the disclosure toggle. |

---

## Database Tables

| Table | Primary Use | Key Columns |
|-------|-------------|-------------|
| `auth.users` (Supabase-managed) | Source of truth for account existence/confirmation. Read ONLY via the `public.auth_email_status` RPC (the `auth` schema is not exposed to PostgREST — PGRST106). | `email`, `email_confirmed_at` |
| `public.access_tokens` | PAT metadata. `workspace_id IS NULL` = global/headless token (the case for signin/signup/confirm-minted PATs). | `id`, `user_id`, `workspace_id`, `name`, `token_prefix`, `scopes text[]`, `expires_at`, `revoked_at`, `last_used_at`. CHECK: `scopes` non-empty AND `scopes <@ {atc:read, atc:write, run:execute, workspace:admin}`. |
| `public.access_token_secrets` | SHA-256 hash of the PAT secret. Sibling table — QA/analytics roles cannot read it. | `token_id`, `hash` |
| `public.auth_email_status` (function, not a table) | SECURITY DEFINER RPC added by migration `0034_auth_email_status_rpc.sql`. `revoke all ... grant execute to service_role` only — anon/authenticated cannot call it directly. | n/a (returns `email_exists boolean, email_confirmed boolean`) |

---

## Business Rules

| Rule | Description | Source |
|------|-------------|--------|
| Email-first routing | Existing+confirmed email -> password step. Existing+unconfirmed -> still routed to password step initially, but a 401 on signin is reinterpreted client-side as "go verify" using `accountConfirmed` from `check-email`. New/unknown email -> create-account step. | `check-email/route.ts`, `email-first-form.tsx` |
| No enumeration on signin | `signin` always returns a uniform 401 "Invalid email or password" regardless of which is wrong — enumeration is intentionally confined to `check-email` only (ADR-0007 tradeoff). | `signin/route.ts` comment |
| Asymmetric password minimums | Sign-up + confirm enforce `min(8)`; sign-in keeps `min(6)` so pre-policy legacy passwords still authenticate. | `signin/route.ts`, `signup/route.ts` comments (explicit BK-166 callout) |
| Verification-first signup, no auto-confirm | `signup` never returns a session or PAT — only `confirm` (after a correct OTP) does. Closes a prior auto-confirm backdoor. | `signup/route.ts` comment |
| PAT default scopes exclude `workspace:admin` | Headless signin/signup/confirm mint PATs with `atc:read, atc:write, run:execute` by default; `assertNoGlobalAdminScope` throws `forbidden` if the caller tries to request `workspace:admin` here — that scope requires `POST /api/v1/tokens` against a specific workspace where the caller is admin/owner. | `lib/api/pat.ts`, ADR-0005, BK-135 |
| Cookie + PAT coexistence | Signing in over the API sets BOTH the Supabase session cookie (server response) AND mints a PAT in the same call — neither revokes the other; a browser session and a CLI token for the same account can be live simultaneously (AC #10). | `signin/route.ts`, `confirm/route.ts` |
| OTP format | Numeric code, regex `\d{6,8}` (accepts 6, 7, or 8 digits). | `confirm/route.ts`, `email-first-form.tsx` (`OTP_REGEX`) |
| Rate limiting | NOT implemented at the Bunkai app layer for any of the 4 BK-166 routes. All 4 routes surface upstream Supabase/PostgREST 429s as `rate_limited` (mapped from `error.status === 429` or PostgREST `error.code === '429'`) — but there is no Bunkai-side limiter/counter. The business-api-map.md Discovery Gap "No rate-limiting middleware" is confirmed accurate as of this session. | `signin/route.ts`, `signup/route.ts`, `confirm/route.ts`, `check-email/route.ts`; absence confirmed via grep of `lib/api/` |
| Magic-link stays visible | Password is primary; magic-link is a collapsed-by-default disclosure ("Email me a link instead") that is NOT removed. OAuth (GitHub/Google) buttons remain visibly disabled ("OAuth ships next sprint"). | `login/page.tsx`, `magic-link-disclosure.tsx` |

---

## Key Entities for Testing

| Entity Type | Name | ID | Use Case |
|-------------|------|-----|----------|
| Test user (confirmed) | Sara — confirmed account | `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD` (see `.env`) | Happy-path signin, wrong-password rejection, rate-limit trigger |
| Test user (unconfirmed) | New signup pending OTP | created ad-hoc via `/login` create step or `admin.generateLink` | Unconfirmed-signin routing, OTP confirm, invalid/expired code |
| API consumer identity | Karim — headless caller | same Supabase user as above, driven via `POST /api/v1/auth/signin` / `/confirm` | PAT + cookie coexistence (AC #10), API-only signup+confirm (AC #11) |
| PAT scopes | Default headless scope set | `atc:read`, `atc:write`, `run:execute` (never `workspace:admin`) | Verify minted PAT on signin/confirm never carries `workspace:admin` |

---

## Common Test Scenarios

| Scenario | Preconditions | Steps | Expected |
|----------|---------------|-------|----------|
| Email-first routing — existing account | Confirmed account exists | Enter known email, continue | Password step shown, no create-account offered |
| Email-first routing — new account | No account for email | Enter unknown email, continue | Create-account step shown, no password-signin field |
| Password signin happy path | Confirmed account + correct password | Enter email, continue, submit correct password | Signed in, lands on Workspace home |
| Wrong password | Confirmed account | Submit wrong password | Generic "email or password incorrect", not signed in, no enumeration |
| Signup -> OTP -> confirm happy path | New email | Submit create form, get 6-8 digit code (admin-confirmed or `admin.generateLink` — see Notes), submit code | 202 pending_confirmation, then confirmed + signed in + lands on Workspace home |
| Unconfirmed signin | Account exists, not confirmed | Enter email, submit correct password | Not signed in, routed to verify step (NOT a generic wrong-password message) |
| Invalid/expired code | On verify step | Enter wrong or expired code | Account stays unconfirmed, "invalid or expired" message, can request new code |
| Rate limiting | Several wrong password/code submissions in quick succession | Exceed attempt threshold | Further attempts temporarily refused, "wait before trying again" — NOTE: this is upstream Supabase GoTrue throttling, not a Bunkai-side limiter (confirmed no app-level rate limiter exists) |
| Magic-link fallback visible | On login screen | Look for non-password alternative | "Email me a link instead" toggle visible, expands to working magic-link form |
| PAT + cookie coexistence | API signin (Karim) + browser signin (same account) | Make API calls with PAT AND browser requests with cookie concurrently | Both accepted as same identity, neither revokes the other |
| API signup+confirm | Karim, API only | `POST /auth/signup` then `POST /auth/confirm` with code | Confirm response returns session + PAT usable on subsequent API calls |

---

## Stories in This Module

| Story | Title | Status | Link |
|-------|-------|--------|------|
| BK-166 | Authentication \| Sign up and sign in with email and password | Ready For QA | [context](./stories/STORY-BK-166-authentication-sign-up-and-sign-in-with-email-and-/context.md) |
| BK-2 | Authentication \| Sign up and sign in with email magic-link | Ready For Release (pre-existing, referenced as traceability parent) | not yet tested in this PBI tree |

---

## Notes

- **Email delivery caveat (active constraint):** the shared Supabase project is on the free-tier email cap. Real signup OTP emails may not arrive until custom SMTP (Resend) is configured (in progress per Ely's comment). For QA test accounts, use admin-confirmed users or `admin.generateLink` to obtain the OTP without depending on inbox delivery. This affects the Signup -> OTP -> confirm scenario directly.
- **PAT scope ADR reference:** ADR-0005 (no global `workspace:admin` issuance) and ADR-0007 (documents the email-first feature + the `check-email` enumeration tradeoff) — both referenced by code comments, not re-read in full this session.
- **Migration applied:** `0034_auth_email_status_rpc.sql` is applied to the shared DB (per comments.md) — adds `public.auth_email_status`, service-role-only.
- **No standalone rate-limit middleware** exists in `lib/api/` as of this session — all 429 handling in the 4 BK-166 routes is a pass-through of upstream Supabase/PostgREST throttling. Treat "rate-limited" AC testing as testing Supabase's GoTrue limits, not a Bunkai feature — keep expectations calibrated accordingly during Stage 2.
- **Smoke already passed on localhost** per Ely's comment (isolated logged-out Playwright profile, all code-path ACs) — staging-specific session smoke (Stage 2) should focus on what differs in staging (real Supabase project capacity, email cap caveat) rather than re-discovering code-path issues already cleared locally.

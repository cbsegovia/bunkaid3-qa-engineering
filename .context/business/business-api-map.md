> Last verified against codebase on 2026-06-08

# BUNKAI TMS — Business API Map

---

## 1. Executive Summary

Bunkai's API lets QA engineers and AI agents build and manage test knowledge from any client — browser, CLI, or automated pipeline — without being blocked on the web UI. The API handles the complete lifecycle of a test management system: from account registration and team onboarding, through organizing the test suite into hierarchical modules, down to authoring the atomic acceptance criteria that define what "working" means for every feature. All of that test knowledge can be seeded directly from Jira with a single import call, eliminating the manual transcription step that costs QA teams hours per sprint.

The surface is narrow by design. There are no test execution or defect filing endpoints yet — those entity types (`ATCs`, runs, defects) appear in the data model but have no route handlers in the current codebase. What exists is a complete, production-grade foundation: multi-tenant workspace isolation, a dual-mode auth scheme that serves both browser sessions and long-lived automation tokens, and a strongly typed error envelope so every client can branch on `error.code` without parsing human-readable messages.

For AI agents and CLI tools in particular, the API was built from the ground up as the primary access path. The headless sign-in and sign-up endpoints mint a Personal Access Token (PAT) in the same round trip as authentication, so an agent can go from zero to fully authorized in a single HTTP call.

---

## 2. Permission & Auth Model

### Tier table

| Tier | Credentials | Who uses it | Endpoint scope | Notes |
|---|---|---|---|---|
| **Public** | None | Anonymous / Supabase OTP link | `POST /api/v1/auth/magic-link`, `POST /api/v1/auth/signin`, `POST /api/v1/auth/signup` | Auth bootstrapping only. No data access. |
| **Cookie (session)** | Supabase session cookie | Web browser | All `/api/v1/*` routes | RLS enforces tenant isolation. Scopes are empty; UI gates handle write control. |
| **Bearer (PAT)** | `Authorization: Bearer bk_pat_<prefix>.<secret>` | CLI, AI agents, CI pipelines | All `/api/v1/*` routes | Scope-checked at write endpoints via `requireScopeOrCookie`. |

### PAT scopes

| Scope | Grants |
|---|---|
| `atc:read` | Read ATC entities |
| `atc:write` | Create / update ATC entities |
| `run:execute` | Trigger test run executions |
| `workspace:admin` | Workspace-level admin operations |

### Token flow diagram

```
Browser / CLI                   API                   Supabase / DB
     |                           |                          |
     |-- POST /auth/signin ------>|                          |
     |   { email, password }      |-- signInWithPassword --->|
     |                           |<-- user + session --------|
     |                           |-- mintPat (admin) ------->| INSERT access_tokens
     |                           |                           | INSERT access_token_secrets (SHA-256)
     |<-- { user, session, pat } -|                          |
     |   (store bk_pat_* NOW)    |                          |
     |                           |                          |
     |-- GET /api/v1/me ----------|                          |
     |   Authorization: Bearer bk_pat_<prefix>.<secret>      |
     |                           |-- lookup token_prefix --> | SELECT access_tokens
     |                           |-- compare SHA-256(secret)-> SELECT access_token_secrets
     |                           |-- touchLastUsed (async) ->| UPDATE access_tokens
     |<-- { user, workspaces }  -|                          |
```

### Where enforcement lives in code

- **Web app routes** (`/projects`, `/onboarding`): `middleware.ts` — redirects unauthenticated requests to `/login` using Supabase session check.
- **API routes** (`/api/v1/*` except auth): `lib/api/auth.ts::requireAuth()` — checks `Authorization` header first (Bearer path), falls back to cookie session. Throws `ApiError('unauthorized')` on failure.
- **Scope enforcement**: `lib/api/auth.ts::requireScopeOrCookie()` — cookie sessions pass through; Bearer tokens must carry the required scope or receive `403 forbidden`.
- **Workspace member isolation**: Supabase RLS policies on `projects`, `modules`, `user_stories`, `acceptance_criteria`, `workspace_members`, `import_jobs`. Cookie client runs queries under the user's JWT; Bearer path uses the admin client with explicit workspace membership joins.
- **Secret storage**: PAT hashes live in `access_token_secrets` (sibling table) — QA/analytics DB roles cannot read them. Same pattern for invite tokens (`workspace_invite_secrets`) and magic link audit rows (`magic_link_token_secrets`).

---

## 3. Critical Business Journeys

### Journey 1 — Authentication (headless + browser)

**Purpose**: Get an authenticated identity. Browser users go through magic-link OTP; CLI/agent callers use email+password and receive a PAT in one call.

```
Headless (CLI/agent):

  Caller                    API                         Supabase Auth
    |                        |                               |
    |-- POST /auth/signin --> |                               |
    |                        |-- signInWithPassword --------> |
    |                        |<-- { user, session } --------- |
    |                        |-- mintPat (admin client) -----> | DB: access_tokens + access_token_secrets
    |<-- { user, session,    |                               |
    |     pat: { token, ... }}|                               |
    |   WARNING: store token NOW — not retrievable later      |

Browser (OTP):

  Browser                   API                         Supabase Auth
    |                        |                               |
    |-- POST /auth/magic-link |                               |
    |   { email, next }       |-- signInWithOtp -----------> |
    |                        |                               |-- email with OTP link
    |<-- { ok: true }         |                               |
    |                        |                               |
    | (user clicks link)      |                               |
    |-- /auth/callback?token  |                               |
    |   (Next.js route) -----> |-- verifyOtp -------------> |
    |                        |<-- session cookies ----------- |
    |<-- redirect to /projects|                               |
```

**Endpoints**: `POST /api/v1/auth/signin`, `POST /api/v1/auth/signup`, `POST /api/v1/auth/magic-link`
**Entities touched**: `auth.users`, `access_tokens`, `access_token_secrets`, `magic_link_tokens` (audit, best-effort)

---

### Journey 2 — Workspace Setup & Team Onboarding

**Purpose**: A QA lead creates an isolated workspace and invites teammates. The workspace is the multi-tenant boundary — all downstream data (projects, stories, ATCs) belongs to exactly one workspace.

```
  Owner                     API                         DB (Supabase)
    |                        |                               |
    |-- POST /workspaces ---> |-- RPC bunkai_bootstrap_workspace -> | INSERT workspaces
    |   { name, slug }        |                               |   INSERT workspace_members (role=owner)
    |<-- { workspace } ------  |                               |
    |                        |                               |
    |-- POST /workspaces/{id}/invites                        |
    |   { email, role }       |-- RLS gate: must be admin/owner |
    |                        |-- generateInviteToken() ----> |
    |                        |-- INSERT workspace_invites --> |
    |                        |-- INSERT workspace_invite_secrets (SHA-256) |
    |<-- { invite, token,    |                               |
    |     accept_url }        | WARNING: copy URL now        |
    |                        |                               |
  Invitee                   API                             |
    |-- POST /invites/accept  |                               |
    |   { token }             |-- hash token, lookup invite -> |
    |                        |-- validate email match ------> |
    |                        |-- UPSERT workspace_members --> | status=active
    |                        |-- stamp accepted_at ----------> |
    |<-- { ok, workspace_id,  |                               |
    |     role }              |                               |
```

**Endpoints**: `POST /api/v1/workspaces`, `GET /api/v1/workspaces`, `GET/PATCH /api/v1/workspaces/{id}`, `POST /api/v1/workspaces/{id}/invites`, `GET /api/v1/workspaces/{id}/invites`, `DELETE /api/v1/workspaces/{id}/invites/{inviteId}`, `POST /api/v1/invites/accept`
**Entities touched**: `workspaces`, `workspace_members`, `workspace_invites`, `workspace_invite_secrets`

---

### Journey 3 — Project & Module Tree Construction

**Purpose**: QA engineers mirror the application under test as a tree of modules. Each module maps to an application area (e.g., `Auth/Login`, `Payments/Refunds`). The tree enforces max depth 6; slugs are auto-derived from names and deduplicated per parent.

```
  QA Engineer               API                         DB
    |                        |                               |
    |-- POST /workspaces/{id}/projects                       |
    |   { name, description } |-- slugify(name) -----------> |
    |                        |-- INSERT projects (RLS: member+) |
    |<-- { project } ------   |                               |
    |                        |                               |
    |-- POST /projects/{id}/modules                          |
    |   { name }              |-- resolve path (app layer) -> |
    |                        |-- check depth <= 6 ----------> |
    |                        |-- INSERT modules (RLS: member+) |
    |<-- { module } ------    |                               |
    |                        |                               |
    |-- POST /projects/{id}/modules                          |
    |   { name, parent_module_id }                           |
    |                        |-- look up parent path -------> |
    |                        |-- path = parentPath/slug -----> |
    |                        |-- depth CHECK (app + DB) ----> |
    |                        |-- INSERT modules -----------> |
    |<-- { module, warning? } |   (warning if depth >= 5)   |
```

**Endpoints**: `POST /api/v1/workspaces/{id}/projects`, `POST /api/v1/projects/{id}/modules`, `GET/PATCH/DELETE /api/v1/modules/{id}`
**Entities touched**: `projects`, `modules`

---

### Journey 4 — User Story Authoring & AC Refinement

**Purpose**: Stories represent features under test. Each story holds Acceptance Criteria (ACs) — the verifiable boundaries that define done. ACs have a positionable order; insertion/move/archive are atomic via SECURITY DEFINER RPC functions to prevent race conditions. A story must have at least one active AC before it can be marked `ready_to_test`.

```
  QA / PO                   API                         DB
    |                        |                               |
    |-- POST /modules/{id}/user-stories                     |
    |   { title, external_id }|-- validate Jira key format -> |
    |                        |-- sanitizeMarkdown(desc) ----> |
    |                        |-- INSERT user_stories (RLS) -> |
    |<-- { user_story }       |                               |
    |                        |                               |
    |-- POST /user-stories/{id}/acceptance-criteria          |
    |   { title, position? }  |-- RPC bunkai_insert_acceptance_criterion |
    |                        |   (atomic position rebalance) |
    |<-- { acceptance_criterion } |                          |
    |                        |                               |
    |-- PATCH /user-stories/{id}                             |
    |   { status: "ready_to_test" }                          |
    |                        |-- RPC bunkai_set_user_story_status |
    |                        |   (locks row, counts active ACs) |
    |                        |   45010 if AC count = 0 -----> |
    |<-- { user_story } or 409|                               |
    |   "Add at least one AC" |                               |
```

**Endpoints**: `POST/GET /api/v1/modules/{id}/user-stories`, `GET/PATCH/DELETE /api/v1/user-stories/{id}`, `POST/GET /api/v1/user-stories/{id}/acceptance-criteria`, `GET/PATCH/DELETE /api/v1/acceptance-criteria/{id}`
**Entities touched**: `user_stories`, `acceptance_criteria`

---

### Journey 5 — Jira Import (Stories + ACs from Jira Cloud)

**Purpose**: QA members bulk-seed stories and acceptance criteria from Jira Cloud using a JQL query. The import runs asynchronously in a Vercel background slot; callers poll for status. At most one import per project can be active at a time. Stories with Jira component names matching existing module names are routed to those modules; unmatched stories go to an auto-created `Inbox` module.

```
  Caller                    API                    Jira Cloud         DB
    |                        |                          |              |
    |-- POST /imports ------> |                          |              |
    |   { project_id, jql }   |-- check active job -----> |             |
    |                        |-- INSERT import_jobs ---> |              |
    |                        |-- after() schedules -----> |             |
    |<-- 202 { import_job_id }|                          |              |
    |                        |                          |              |
    |                        |  (background worker)     |              |
    |                        |-- claim job (UPDATE status=running) --> |
    |                        |-- load modules (name map) -----------> |
    |                        |-- POST /rest/api/3/search/jql -------> |
    |                        |           (paged, up to 1000 pages)    |
    |                        |<-- page of issues -------- |            |
    |                        |-- per issue:               |            |
    |                        |   adfToMarkdown(desc)      |            |
    |                        |   extractAcceptanceCriteria |            |
    |                        |   resolveModule (component match / Inbox) |
    |                        |   UPSERT user_stories (keyed on external_id) -> |
    |                        |   reconcileCriteria (append-only) ----> |
    |                        |-- UPDATE import_jobs (counts + errors) -> |
    |                        |-- status=completed ---------------------> |
    |                        |                          |              |
    |-- GET /imports/{id} --> |-- SELECT import_jobs ---> |             |
    |<-- { status, counts,    |                          |              |
    |     errors[] }          |                          |              |
```

**Endpoints**: `POST /api/v1/imports`, `GET /api/v1/imports/{id}`
**Entities touched**: `import_jobs`, `user_stories`, `acceptance_criteria`, `modules` (Inbox auto-creation)

---

### Journey 6 — PAT Lifecycle Management

**Purpose**: Authenticated users can issue, list, and revoke Personal Access Tokens from the web app to authorize CLI tools and agents. PAT creation requires a live browser session (cookie) — a PAT cannot mint another PAT. Revocation is a soft delete (row stays in audit trail).

```
  Browser User              API                         DB
    |                        |                               |
    |-- POST /tokens -------> |-- verify cookie session ----> |
    |   { scopes, name }      |-- generateSecret(32 bytes) -> |
    |                        |-- SHA-256(secret) -----------> |
    |                        |-- INSERT access_tokens ------> |
    |                        |-- INSERT access_token_secrets -> |
    |<-- { id, token,        |                               |
    |     WARNING }           |                               |
    |   (store bk_pat_* now) |                               |
    |                        |                               |
    |-- GET /tokens --------> |-- RLS scopes to auth.uid() -> |
    |<-- { tokens[] }         |   (no secret/hash returned)  |
    |                        |                               |
    |-- DELETE /tokens/{id} -> |-- soft-revoke: set revoked_at |
    |<-- 204                  |                               |
```

**Endpoints**: `POST /api/v1/tokens`, `GET /api/v1/tokens`, `DELETE /api/v1/tokens/{id}`
**Entities touched**: `access_tokens`, `access_token_secrets`

---

## 4. Architecture Behind the API

### Layered diagram

```
+----------------------------------------------------------------------+
|  Next.js App Router  (app/api/v1/**)                                 |
|  Route handlers — validate input (Zod), call auth, delegate to DB   |
+-------------------------------+--------------------------------------+
                                |
          +---------------------+---------------------+
          |                     |                     |
+---------+--------+  +---------+--------+  +---------+--------+
|  lib/api/        |  |  lib/supabase/   |  |  lib/jira/       |
|  auth.ts         |  |  server.ts       |  |  client.ts       |
|  pat.ts          |  |  admin.ts        |  |  import-runner.ts|
|  handler.ts      |  |  rpc.ts          |  |  extract-ac.ts   |
|  error-envelope  |  |  with-workspace  |  |  adf-to-markdown |
+------------------+  +------------------+  +------------------+
          |                     |
+---------+--------+  +---------+--------+
|  Supabase RLS    |  |  Supabase RPCs   |
|  (tenant iso.)   |  |  (atomic ops)    |
+------------------+  +------------------+
          |
+---------+--------+
|  PostgreSQL      |
|  (via Supabase)  |
+------------------+
```

### Component table

| Component | Role | Persistence | Why it matters for QA |
|---|---|---|---|
| `lib/api/handler.ts` | `withApiHandler` wrapper — request-id injection, structured logging, error normalization | None | Every API error carries `x-request-id` for log correlation — use it in bug reports |
| `lib/api/auth.ts` | Dual-mode auth: cookie OR Bearer PAT | None (reads DB) | The same `requireAuth()` gate is used across all protected routes — one bypass here is a universal bypass |
| `lib/api/pat.ts` | PAT minting shared helper | `access_tokens` + `access_token_secrets` | Regression risk: hash-then-split logic was previously broken (comments reference a fix) |
| `lib/api/middleware/bearer.ts` | Bearer token resolution — prefix-indexed lookup + SHA-256 comparison | Reads `access_tokens`, `access_token_secrets` | All CLI/agent auth funnels through here |
| `lib/supabase/server.ts` | Cookie-scoped Supabase client (session JWT) | Supabase Auth | Used for all browser-facing reads/writes; RLS enforces isolation |
| `lib/supabase/admin.ts` | Service-role client (bypasses RLS) | Supabase service role | Used for auth bootstrapping and invite acceptance — scope is intentionally narrow |
| `lib/jira/import-runner.ts` | Async Jira import worker (Vercel `after()`) | `import_jobs`, `user_stories`, `acceptance_criteria`, `modules` | Only background async process — failures are silent to the user unless polled |
| `lib/jira/client.ts` | Jira Cloud REST v3 search client | None (HTTP) | Reads `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` from env — misconfigured env = silent `jira_unauthorized` failure at import time |
| `lib/api/error-envelope.ts` | Canonical error shape: `{ error: { code, message, details, request_id } }` | None | All tests should branch on `error.code`, not `error.message` — messages are human text, codes are stable |
| Supabase SECURITY DEFINER RPCs | Atomic multi-step operations (`bunkai_bootstrap_workspace`, `bunkai_insert_acceptance_criterion`, `bunkai_move_acceptance_criterion`, `bunkai_archive_acceptance_criterion`, `bunkai_set_user_story_status`) | PostgreSQL | These RPCs run under elevated DB privileges; test RLS bypass scenarios here |

---

## 5. External Integrations

| Service | Trigger | Direction | Failure mode (user-visible) | Journeys affected |
|---|---|---|---|---|
| **Supabase Auth** | Every auth call (sign-in, sign-up, OTP, session refresh) | Outbound (service call) | `upstream_error` 502 or `unauthorized` 401 — login fails silently if Supabase is down | J1, J6 |
| **Supabase DB (RLS client)** | All data reads/writes via cookie session | Outbound | `internal_error` 500 — generic DB error; no retry | J2, J3, J4, J5, J6 |
| **Supabase DB (admin/service-role)** | Auth bootstrapping, invite acceptance, PAT lookup, import worker | Outbound | `internal_error` 500 — surfaces the Supabase `error.message` | J1, J2, J5, J6 |
| **Jira Cloud REST v3** | `POST /api/v1/imports` (background, Vercel `after()`) | Outbound (server-to-server) | `import_job.status = "failed"`, `errors[].code = "jira_unauthorized"` if creds wrong; `jira_error` for other HTTP failures. Rate-limited requests retry up to 5 times with exponential backoff. | J5 only |
| **Vercel (platform)** | `next/server`'s `after()` schedules import background job | Platform runtime | If the Vercel function is killed before the job completes, `import_job` stays in `running` state indefinitely — no dead-letter recovery in current code | J5 only |

---

## 6. Cross-References

| Document | Content | Location |
|---|---|---|
| Business Data Map | Entity ERD, data flows, state machines for stories, RLS summary | `.context/business/business-data-map.md` |
| Business Feature Map | Feature catalog, CRUD matrix, integrations inventory | `.context/business/business-feature-map.md` (generate with `/business-feature-map` if not present) |
| OpenAPI spec | Machine-readable endpoint schema (Zod-to-OpenAPI) | `GET /api/openapi` (served live); `GET /api/docs` (Scalar UI) — run the app to access |
| OpenAPI route definitions | `*.route.openapi.ts` files co-located with every route handler | `app/api/v1/**/*.route.openapi.ts` |
| TypeScript API schemas | Auto-generated from OpenAPI sync (`bun run api:sync`) | `api/schemas/` in the QA repo (`bunkai-qa-engineering-benja`) |
| Supabase generated types | Full DB type definitions | `lib/types/supabase.ts` |
| Environment variable contract | All required/optional env vars with descriptions | `lib/env.ts` |

---

## 7. Discovery Gaps

| Gap | Evidence / Risk level |
|---|---|
| **ATC, Test Run, Defect endpoints do not exist** | `app/api/v1/` has no route for ATCs, test runs, or defects. The data model references these entities (visible in `lib/types/supabase.ts` and DESIGN.md) but they have no API surface yet. Any QA testing against "test execution" or "defect filing" flows has no backend to hit. **High risk for automation planning.** |
| **Jira import stuck-in-running state** | The `import_jobs` table has no recovery path if Vercel kills the background function mid-run. A job can be stuck at `status = "running"` forever, and the serialization gate (at most one active import per project) will block all future imports for that project. No admin endpoint to force-reset a stuck job was found. |
| **Magic-link OTP audit table** | `magic_link_tokens` is inserted best-effort in the route; the table columns referenced (`email`, `user_agent`) are visible but the full schema, indexes, and RLS were not verified in migrations. Audit completeness is unverifiable from route code alone. |
| **Invite email delivery** | MVP does not send invitation emails — the `accept_url` is returned in the API response body and logged to server stdout. The comment in the code says "MVP has no transactional email yet". If the caller loses the response, the invite URL is unrecoverable without server log access. |
| **Workspace invite revoke endpoint** | `GET/DELETE /api/v1/workspaces/{id}/invites/{inviteId}` has an OpenAPI definition file (`route.openapi.ts`) but the implementation file was not confirmed to exist. Listed as a potential stub. |
| **`active_workspace` endpoint** | `app/api/v1/me/active-workspace/` has both `route.ts` and `route.openapi.ts` but was not read during this pass. Its exact behavior (set/read the `bk_active_ws` cookie) is inferred from `lib/api/workspace-cookie.ts` references in `/me`. |
| **No rate-limiting middleware** | The magic-link route comment says "Phase F adds a real rate-limit middleware". Currently, Supabase's built-in OTP rate limits are the only protection. Excessive magic-link requests will surface as `429 rate_limited` from the upstream, not from Bunkai itself. |

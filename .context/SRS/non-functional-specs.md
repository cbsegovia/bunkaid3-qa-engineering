# Bunkai TMS — Non-Functional Specifications

> Generated: 2026-08-14 by `/project-discovery` Phase 2, SRS sub-step 3.
> Method: reverse-engineered from `package.json` dependencies, `lib/api/**`, `supabase/migrations/*.sql`. No load-testing, monitoring dashboard, or production incident data was available to this session — every numeric target below is either evidenced by a concrete config value or explicitly marked "not implemented — recommend adding."
> **Discrepancy notice**: the target's own internal `.context/SRS/non-functional-specs.md` (not read in full this pass, per the SRS canon of citing only what's implemented) is expected to describe the same aspirational Cloud/Community two-edition stack (Sentry, PostHog, R2, rate-limiting service) seen in its architecture-specs.md. This document reports only what `package.json` and the code actually contain today.

---

## NFR Summary

| Category | Implemented | Maturity |
|---|---|---|
| Performance | Partial (search indexing, RLS-performance indexes) | Low — no caching layer, no rate limiting, no load-test evidence |
| Security | Partial (RLS-everywhere, hashed secrets, non-disclosing errors) | Medium — strong data-layer design, no security-header hardening found |
| Reliability | Partial (idempotency, row-locked state transitions, error envelope) | Medium — no retry/circuit-breaker layer, no health-check beyond a basic `/health` route |
| Scalability | Partial (stateless serverless-shaped Route Handlers) | Low — no connection-pool tuning or async job queue found |
| Observability | Minimal | Low — no APM/error-tracking SDK, no structured metrics found |

---

## 1. Performance

### NFR-PERF-001: Database Query Optimization — RLS-aware indexing

| Aspect | Value |
|---|---|
| **Target** | Not benchmarked — inferred design intent from migration comments |
| **Implementation** | `workspaces_owner_user_id_idx`, `workspace_members_user_id_idx` created specifically because "what workspaces does this user belong to?" is the dominant RLS-subquery path on every table |
| **Evidence** | `supabase/migrations/0001_tenancy.sql` |

The migration's own comment names RLS overhead as a known cost: "the founder conversation highlighted that RLS overhead becomes visible at scale" (per the target's own architecture-specs.md, cross-referenced — not independently reproducible from this repo's migrations alone). No query-plan (`EXPLAIN`) evidence was gathered this session.

### NFR-PERF-002: Full-text search

| Aspect | Value |
|---|---|
| **Target** | Not benchmarked |
| **Implementation** | Postgres `tsvector` column (`tsv`) on `atcs`, GIN-style search | 
| **Evidence** | `supabase/migrations/0027_atc_search.sql`; `lib/atcs/search-validation.ts` |

### NFR-PERF-003: Caching

**Not implemented.** No Redis, in-memory cache, or Next.js `revalidate`/`cache:` tuning was found in `lib/**` or `app/**` in this pass. **Discovery Gap** — flag for load-test before any high-traffic launch.

### NFR-PERF-004: Rate limiting

**Not implemented at the application layer.** No rate-limiting middleware, no `@upstash/ratelimit` or equivalent dependency in `package.json`. The `RATE_LIMITED` error code exists in `lib/api/error-envelope.ts` (`API_ERROR_CODES.RATE_LIMITED`, HTTP 429) but no call site producing it was found — the code is defined defensively, not wired to an active limiter. **Recommend adding** before exposing the API to untrusted/high-volume callers.

### NFR-PERF-005: Content size budgets

| Aspect | Value |
|---|---|
| **Target** | ATC step/assertion content capped at 2048 UTF-8 bytes per field |
| **Implementation** | `byteLength()` check (not `.max()`, to measure multibyte content correctly), `MAX_ATC_CONTENT_BYTES = 2048` |
| **Evidence** | `lib/atcs/validation.ts` lines 11–20 |

This is a deliberate payload-size guard, doubling as a performance control against unbounded Markdown blobs.

---

## 2. Security

### NFR-SEC-001: Authentication

| Aspect | Value |
|---|---|
| **Target** | Every `/api/v1/*` route (except public auth endpoints) requires a resolved `Principal` |
| **Implementation** | Dual cookie-session (Supabase SSR) / Bearer PAT (`bk_pat_<prefix>.<secret>`) resolution, unified into one `Principal` shape |
| **Evidence** | `lib/api/principal.ts` lines 45–74 |

### NFR-SEC-002: Authorization

| Aspect | Value |
|---|---|
| **Target** | Zero authorization logic duplicated in TypeScript — Postgres RLS is the single source of truth |
| **Implementation** | RLS policy on every table with a `workspace_id`; `requireCapability`/`assertWorkspaceContext` constrain PAT callers additionally |
| **Evidence** | `supabase/migrations/0001_tenancy.sql` §3 policies; `lib/api/principal.ts` lines 76–104 |

### NFR-SEC-003: Secret storage

| Aspect | Value |
|---|---|
| **Target** | No plaintext secret ever persisted |
| **Implementation** | PAT secrets, workspace-invite tokens, and magic-link audit rows are SHA-256-hashed and stored in dedicated sibling tables (`access_token_secrets`, `workspace_invite_secrets`, `magic_link_token_secrets`), unreadable by QA/analytics DB roles |
| **Evidence** | `business-api-map.md` §2 "Where enforcement lives in code" |

### NFR-SEC-004: Non-disclosure of cross-tenant existence

| Aspect | Value |
|---|---|
| **Target** | A caller must never learn whether a resource exists in a workspace they cannot access |
| **Implementation** | `atc_not_in_workspace` (SQLSTATE `45122`) collapses "foreign-workspace id" and "nonexistent id" into one uniform error with no id echoed back |
| **Evidence** | `supabase/migrations/0024_tests.sql` lines 208–225, documented as invariant "INV-3" |

### NFR-SEC-005: Structured error contract

| Aspect | Value |
|---|---|
| **Target** | Every error response uses one envelope shape so clients branch on `error.code`, never parse `message` |
| **Implementation** | `ApiErrorBody { error: { code, message, details?, request_id? } }`, ~25 distinct codes across auth/ATC/Test/Run domains |
| **Evidence** | `lib/api/error-envelope.ts` |

### NFR-SEC-006: Security headers

**Not implemented / not found.** No `headers()` function in `next.config.*`, no Helmet-equivalent, no CSP string. No `helmet`, `xss`, `csrf`, or `sanitize-html`-class dependency beyond `rehype-sanitize` (used for rendering user-authored Markdown, not a general XSS-hardening layer) in `package.json`. **Recommend a security review** before production hardening claims are made.

### NFR-SEC-007: Input sanitization (Markdown fields)

| Aspect | Value |
|---|---|
| **Target** | User-authored Markdown (module/story descriptions) rendered safely |
| **Implementation** | `react-markdown` + `remark-gfm` + `rehype-sanitize` on the render path |
| **Evidence** | Phase 1 `project-config.md` tech-stack section |

### NFR-SEC-008: Password hashing / OAuth

Handled entirely by Supabase Auth (managed service) — no custom password-hashing code found in this repo, which is expected and correct for this architecture. Not independently verified against Supabase's own security posture (out of scope for a code-only reverse-engineering pass).

---

## 3. Reliability

### NFR-REL-001: Idempotent writes

| Aspect | Value |
|---|---|
| **Target** | A retried POST with the same `Idempotency-Key` must not repeat a business write |
| **Implementation** | `idempotency_keys` table + `lib/api/idempotency.ts` state machine (pending/succeeded/failed, compare-and-set reclaim) |
| **Evidence** | `supabase/migrations/0009_cross_cutting.sql`; `lib/api/idempotency.ts` |

### NFR-REL-002: Concurrency-safe terminal-state transitions

| Aspect | Value |
|---|---|
| **Target** | A Run can only be finished/aborted once, even under concurrent requests |
| **Implementation** | `FOR UPDATE` row lock + status re-check inside `bunkai_finish_run`/`bunkai_abort_run` |
| **Evidence** | `supabase/migrations/0037_run_finish.sql` lines 39–43 |

### NFR-REL-003: Health check

| Aspect | Value |
|---|---|
| **Target** | A basic liveness signal for external monitoring |
| **Implementation** | `GET /api/v1/health` — returns `{ ok: true, service, env, ts }`, public, `dynamic = 'force-dynamic'` |
| **Evidence** | `app/api/v1/health/route.ts` |

No readiness check (e.g., a DB-connectivity probe) was found — the health route does not query the database.

### NFR-REL-004: Error boundaries / retry logic

**Not found.** No `error.tsx` App Router boundary files, no retry/backoff utility, no circuit-breaker around external calls (Jira import) was located in this pass. The Jira import job's `failed` status (per its state machine) is the only observed failure-terminal state; whether it auto-retries is unconfirmed. **Discovery Gap.**

### NFR-REL-005: Logging

| Aspect | Value |
|---|---|
| **Target** | Structured request logging with a traceable request id |
| **Implementation** | `lib/api/request-id.ts`, `lib/api/logging.ts` — request-id is injected and threaded into the error envelope (`request_id` field) |
| **Evidence** | `lib/api/error-envelope.ts` line 12 (`request_id?: string`), `lib/api/logging.ts` |

No external log-shipping (Datadog, Logtail, Axiom) dependency found — logs are presumed to stay in the hosting platform's default stdout capture (Vercel), unconfirmed.

---

## 4. Scalability

### NFR-SCALE-001: Stateless request handling

| Aspect | Value |
|---|---|
| **Target** | No in-memory session/request state held across requests |
| **Implementation** | Next.js Route Handlers on (inferred) Vercel serverless — session state lives in the cookie (Supabase JWT) or the Bearer token, not server memory |
| **Evidence** | Architecture pattern; `dynamic = 'force-dynamic'` on the health route confirms no static/edge caching assumption there |

### NFR-SCALE-002: Database connection handling

**Not found.** No explicit connection-pool size configuration (`DATABASE_POOL_SIZE` or equivalent) was located in code — Supabase's managed pooler (PgBouncer-class) is assumed but not independently confirmed in this repo. **Discovery Gap.**

### NFR-SCALE-003: Async job processing

| Aspect | Value |
|---|---|
| **Target** | Long-running work (Jira import) does not block the request/response cycle |
| **Implementation** | `import_jobs` table with a `queued`/`running`/`completed`/`failed` status, polled by the client rather than awaited synchronously |
| **Evidence** | `supabase/migrations/0019_import_jobs.sql`; `lib/jira/import-runner.ts` |

No dedicated job-queue library (`bullmq`, `pg-boss`) was found — the import job appears to run in-process (serverless function invocation), not via a durable queue. **Discovery Gap** for scale beyond MVP volume.

### NFR-SCALE-004: Horizontal scaling posture

Inherently horizontal-scalable given the stateless serverless deploy shape and RLS-enforced tenant isolation (no cross-request server-side state to coordinate). Not load-tested in this pass.

---

## 5. Observability

### NFR-OBS-001: Application performance monitoring (APM)

**Not implemented.** No `@sentry/*`, `@datadog/*`, `newrelic`, or `@opentelemetry/*` dependency found in `package.json`.

### NFR-OBS-002: Product analytics

**Not implemented.** No PostHog, Amplitude, Mixpanel, or Segment dependency found.

### NFR-OBS-003: Metrics / tracing

**Not implemented.** No `prom-client` or custom counter/gauge/histogram code found; no OpenTelemetry spans.

### NFR-OBS-004: Structured logging + request correlation

| Aspect | Value |
|---|---|
| **Target** | Every request traceable via a request id |
| **Implementation** | `lib/api/request-id.ts` + `lib/api/logging.ts`, threaded into `ApiErrorBody.error.request_id` |
| **Evidence** | `lib/api/error-envelope.ts`, `lib/api/logging.ts` |

This is the **only** observability primitive confirmed in the codebase. Everything else in this category is a gap.

---

## Compliance

| Framework | Status |
|---|---|
| GDPR | Needs Review — no data-retention/deletion policy code found; `workspaces_delete_owner` RLS policy exists but cascading personal-data erasure was not traced |
| SOC2 | Needs Review — no audit-log completeness verification performed; `activity_log`/`import_jobs` exist but were not cross-checked against SOC2 control requirements |
| HIPAA | Needs Review — not applicable unless the product targets healthtech customers (unconfirmed; target's own aspirational PRD names healthtech as a candidate segment) |
| PCI-DSS | Not applicable — no payment-card data handling found in the schema |

None of the above should be read as pass/fail; they are unverified, not failed.

## Discovery Gaps

- No load-test, benchmark, or production-incident data was available — every numeric performance claim above is either a concrete config value (2048-byte content budget, 7-day invite expiry) or explicitly marked absent.
- RLS performance-at-scale claim is sourced from a migration-comment reference to "the founder conversation," not independently reproducible from this repo alone.
- Connection-pool sizing, log-shipping destination, and Jira-import retry behavior are all unconfirmed.
- Security-header posture (CSP, HSTS, X-Frame-Options) was not found configured anywhere — recommend a dedicated security review pass rather than treating this as "acceptable by omission."
- Compliance framework applicability (GDPR/SOC2/HIPAA) depends on target market decisions not evidenced in code — needs product-owner input.

## QA Relevance

| NFR | Testable? | Suggested Tooling |
|---|---|---|
| NFR-PERF-004 (rate limiting) | Not testable today — no limiter to exercise; flag as an untested risk in every release sign-off until implemented | k6 / Artillery once a limiter exists |
| NFR-SEC-002/004 (RLS + non-disclosure) | Yes — highest-value security test target in this codebase | Direct API probing with two workspace-scoped PATs (cross-tenant read/write attempts) |
| NFR-REL-001/002 (idempotency, concurrent terminal transitions) | Yes | Concurrent-request harness (Playwright API mode or raw `fetch` with `Promise.all`) hitting the same Idempotency-Key / same Run finish endpoint simultaneously |
| NFR-OBS-001/002/003 (APM/analytics/metrics) | Not testable — nothing to assert against | N/A until instrumented |
| NFR-SCALE-003 (async import) | Partially — job status polling is testable; queue durability under load is not | Manual/API-level polling assertions today; load-test tooling once a real queue exists |

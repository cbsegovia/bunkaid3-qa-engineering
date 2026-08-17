# Bunkai TMS — Executive Summary

> Generated: 2026-08-14 by `/project-discovery` Phase 2, PRD sub-step 1.
> Method: reverse-engineered from `../upex-bunkai-tms` route tree, `supabase/migrations/*.sql` (0001–0037), `package.json`, and this QA repo's Phase 1 outputs (`business-model.md`, `domain-glossary.md`).
> **Discrepancy notice**: the target repo carries its own pre-existing `.context/PRD/executive-summary.md`, written as a forward-looking product-planning document (mentions Bunkai Cloud/Community/Enterprise editions, native bug management, WebSocket streaming, Sentry/PostHog, self-hosted Docker Compose). That document is **aspirational** and predates or outpaces the current implementation — several features it lists as MVP (native `bugs` table, Realtime streaming, observability stack) are not present in the code as of this discovery pass. This document describes **only what the code does today**; deltas are called out inline and consolidated in Discovery Gaps.

---

## 1. Problem Statement

### The Challenge

QA teams need to prove that what they tested maps to what the business asked for, and today's tools make that link optional. Bunkai's schema encodes the fix directly: an ATC (Acceptance Test Case) cannot exist without being bound to at least one Acceptance Criterion. The migration comment for this rule calls it "the anchoring moat — enforced at the application layer in MVP, made structural by FK" (Source: `supabase/migrations/0004_atcs.sql`, lines 1–6).

The same traceability problem repeats one level up: a Run (a test execution) must still say what it validated after the source ATC has since been edited. Bunkai's schema solves this by snapshotting the ATC chain and every step's content at Run-start time, so a later edit to the live ATC never rewrites history (Source: `supabase/migrations/0031_runs.sql`, comment: *"run_atcs — snapshot of each chain position at start"*).

### Current Alternatives

Not directly evidenced in this codebase (no competitor-comparison copy exists in the target repo — its own README is the generic scaffolding README, not product marketing). The target's own internal (aspirational) PRD names Xray, Zephyr Scale, TestRail, and qTest as reference points, but that framing is not verifiable from code and is flagged as a Discovery Gap.

## 2. Solution Overview

### Product Vision (one sentence)

A Test Management System whose data model structurally forces every test case to trace back to a business requirement, and every execution record to stay immutable once frozen.

### Core Capabilities

| # | Feature | Problem Addressed | Evidence (route or component) |
|---|---|---|---|
| 1 | ATC library (reusable, AC-anchored test units) | Duplicated/orphaned test steps with no link to a requirement | `app/(app)/projects/[projectSlug]/atcs/**`, `supabase/migrations/0004_atcs.sql` |
| 2 | Tests as ordered ATC chains | Free-form, non-reusable test scripts | `app/(app)/projects/[projectSlug]/tests/**`, `supabase/migrations/0024_tests.sql` |
| 3 | Runs with frozen chain/step snapshots | Execution history silently drifting when source ATCs are edited | `app/(app)/projects/[projectSlug]/runs/[runId]/page.tsx`, `supabase/migrations/0031_runs.sql`, `0037_run_finish.sql` |
| 4 | Workspace → Project → Module hierarchy (multi-tenant) | Test suites with no organizational boundary or tenant isolation | `app/(app)/workspaces/**`, `supabase/migrations/0001_tenancy.sql`, `0002_projects_modules.sql` |
| 5 | Jira import (async, idempotent US+AC upsert) | Manual re-transcription of backlog stories into the TMS | `lib/jira/import-runner.ts`, `app/api/v1/imports/**` |

*(5 capped per doctrine; API/CLI surface — dual cookie+PAT auth, OpenAPI docs — is a cross-cutting enabler covered in Architecture Specs, not counted as a 6th product feature.)*

### Key Differentiators

- Structural (FK-backed) enforcement of the AC-anchoring rule, not a UI convention — verified in `0004_atcs.sql`.
- Snapshot-on-start Run model: `run_atcs`/`run_steps` are independent copies, `atc_id`/`atc_step_id` are `on delete set null` provenance-only — verified in `0031_runs.sql`.
- Dual-mode API identity: a browser cookie session and a Bearer PAT (`bk_pat_<prefix>.<secret>`) resolve to the same `Principal` shape, so handlers never branch on auth method (Source: `lib/api/principal.ts`, "ADR-0001" comment).

## 3. Success Metrics

### Tracked Metrics

None found. No `track()`/`analytics.event()` call sites and no analytics SDK (`posthog`, `mixpanel`, `amplitude`, `segment`) in `package.json` dependencies.

### Inferred KPIs (from features, not real tracking)

| Metric | Type | Rationale |
|---|---|---|
| ATCs created per workspace | Engagement | Core authoring loop; anchoring-moat rule makes this the primary unit of value |
| Test-to-ATC reuse ratio | Engagement | Product's stated differentiator (chains reference, not copy, ATCs) |
| Runs completed (`passed`/`failed`/`aborted`) per Project | Adoption | Only measurable execution-lifecycle signal in the schema |

### Unknown Metrics

- Retention, activation, or revenue metrics — no telemetry, no billing integration found (`workspaces.plan` column exists but no Stripe/Paddle/LemonSqueezy dependency).

## 4. Target Users (brief)

| System Role | Need | Evidence |
|---|---|---|
| Workspace `owner`/`admin` | Set up the tenant boundary, manage membership/billing plan field | `workspace_members.role` CHECK, `supabase/migrations/0001_tenancy.sql` |
| Workspace `member` | Author Modules/Stories/ACs/ATCs, assemble Tests, execute Runs | Full CRUD surface across `app/api/v1/{modules,user-stories,acceptance-criteria,atcs,tests,runs}` |
| Workspace `viewer` | Read-only consumption of coverage/execution state | Role enumerated in `workspace_members.role` CHECK; no route-level evidence of a distinct read-only UI mode found — see Discovery Gaps |
| Headless / AI-agent caller (PAT `bk_pat_*`) | Drive the same CRUD + Run lifecycle from CI/automation without a browser session | `lib/api/principal.ts`, `lib/api/pat.ts`, `runs.executor_mode` ∈ `human`/`agent`/`ci` |

Full personas → `user-personas.md`.

## 5. Product Scope

### What's Included (current capabilities)

- Multi-tenant Workspace/Project/Module hierarchy with RLS on every table.
- User Story + Acceptance Criteria authoring, with optional Jira import.
- ATC authoring (steps, assertions, AC bindings), full-text search, duplicate, versioning.
- Test assembly (ordered ATC chains), reorder, tagging.
- Run lifecycle: create (`bunkai_create_run`), execute step-by-step, abort (`bunkai_abort_run`), finish with verdict (`bunkai_finish_run`).
- Personal Access Token issuance/listing/revocation for headless/CI callers.
- OpenAPI spec + Scalar interactive docs at `/api/docs`; `/qa` testability guide page.
- Coverage/traceability read view rendering the full US → AC → ATC → Test → Run → linked-Jira-defect chain (BK-44/45/50), plus a read-only export snapshot of that chain (BK-50).

### What's Not Included (known limitations)

- No native in-app defect/bug entity — no `bugs`/`defects` table in any of the 37 migrations. "Defects" surfaced in the traceability view are external Jira issue links, not a Bunkai-owned entity.
- No reporting/analytics/ROI routes (`app/` has no `reports` or `analytics` segment).
- No CI/CD pipeline in the target repo (no `.github/workflows/`).
- GitHub/Google OAuth are UI stubs only — backend not wired (per `business-feature-map.md` §2.1, re-confirmed: `app/auth/oauth/[provider]` exists as a route but sign-in flows documented as Active are magic-link + headless email/password).
- No project DELETE/PATCH endpoint (project rename/removal not implemented).

### Future Indicators

- `feature_flags` table with `scope` ∈ `global`/`workspace` exists (`supabase/migrations/0009_cross_cutting.sql`) but no flag-gated feature was found wired to it in the route tree — infrastructure ahead of usage.
- `workspaces.plan` ∈ `community`/`cloud`/`enterprise` — billing/license-gating column exists with no enforcement code found.

## 6. Discovery Gaps

| Gap | Impact | Suggested Source |
|---|---|---|
| No product-positioning copy in the target repo itself (README is generic scaffolding) | Problem Statement/Current Alternatives rely on schema inference, not marketing language | Ask the product owner, or treat the target's own `.context/PRD/executive-summary.md` as a *planning* doc, not ground truth |
| No analytics/telemetry SDK found | Cannot verify any Adoption/Engagement metric with real data | Confirm whether a metrics pipeline exists outside this repo (e.g. Vercel Analytics dashboard) |
| Viewer-role UI restriction not directly observed | Cannot confirm the read-only role is enforced client-side vs. RLS-only | Inspect `components/**` for `role === 'viewer'` conditionals in a follow-up pass |
| Target's own internal PRD describes a materially larger MVP (native bugs, WebSocket, Sentry/PostHog, self-hosted edition) than what ships in code | Risk of testing against aspirational docs instead of the real app | Treat target's internal `.context/PRD`/`.context/SRS` as roadmap, not spec; this QA repo's docs are the reverse-engineered ground truth |

## 7. QA Relevance

### Critical Testing Areas

- AC-anchoring rejection path (0 ACs bound to a new ATC) — boundary at exactly 1.
- Cross-tenant isolation (workspace A cannot read/write workspace B's rows) — RLS is the sole enforcement layer.
- Run snapshot immutability — editing a source ATC after a Run completes must not change the Run's recorded content.
- Dual auth parity — every protected `/api/v1/*` route must behave identically under cookie session and Bearer PAT.

### Risk Areas

- No CI/CD means regression suites for this product currently depend on local/manual execution (no hosted pipeline to gate merges).
- No rate-limiting or observability stack found — abuse/error-spike detection has no automated backstop today.

## 8. Document References

| Document | Status |
|---|---|
| `.context/PRD/user-personas.md` | Complete (this phase) |
| `.context/PRD/user-journeys.md` | Complete (this phase) |
| `.context/business/business-feature-map.md` | Pre-existing (generated 2026-06-08, predates Runs shipping — cross-referenced, not superseded here) |
| `.context/SRS/architecture.md` | Complete (this phase) |
| `.context/SRS/functional-specs.md` | Complete (this phase) |
| `.context/SRS/non-functional-specs.md` | Complete (this phase) |

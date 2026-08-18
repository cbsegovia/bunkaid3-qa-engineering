# Bunkai TMS — Business Model

> Generated: 2026-08-14 by `/project-discovery` Phase 1, Sub-step 3.
> Method: reverse-engineered from `../upex-bunkai-tms` route structure + `supabase/migrations/*.sql` + this QA repo's pre-existing `.context/business/business-data-map.md` and `business-feature-map.md` (both previously generated against the same target repo).
> Confidence overall: **Medium** — the target repo's own `README.md` describes the shared scaffolding framework, not the Bunkai product, so no first-party marketing/positioning copy exists to cite. All claims below are inferred from schema + route shape + feature inventory, not product copy.

## 1. Problem Statement

Bunkai TMS addresses the gap between business requirements (User Stories, Acceptance Criteria) and verifiable test coverage. The schema anchors every reusable test unit (an ATC — Acceptance Test Case) to at least one Acceptance Criterion via the `atc_acceptance_criteria` join table, an invariant the migration comments call "the anchoring moat" (Source: `supabase/migrations/0004_atcs.sql`, lines 1–6: *"ATC = Acceptance Test Case. Anchored to a project + module + user story and bound to ≥1 acceptance criterion... the anchoring moat — enforced at the application layer in MVP, made structural by FK"*). This suggests the core problem being solved is traceability: making sure test cases are never authored disconnected from the business requirement they verify.

The product also targets team-scale, multi-tenant usage rather than a single team/project: the schema's outermost boundary is `workspaces` (Source: `supabase/migrations/0001_tenancy.sql`), with role-based membership (`viewer`/`member`/`admin`/`owner`) and a `plan` column already modeling `community`/`cloud`/`enterprise` tiers even though billing logic is not yet implemented (Found in: `business-feature-map.md` §2.2, "Plans: `community` \| `cloud` \| `enterprise` (field exists, billing logic not implemented)").

Confidence: Medium — inferred from structural design intent (schema comments, anchoring invariant), not from an explicit product-positioning document.

## 2. Business Model Canvas

### Customer Segments
- QA / test-engineering teams authoring and organizing structured test suites (Source: route naming `app/(app)/projects`, `app/qa`, and entity naming ATC/Test/Run mirroring TMS vocabulary — Xray, TestRail-class tools)
- Organizations already running Jira, given the built-in async Jira import feature that pulls stories + ACs (Found in: `business-feature-map.md` §"Jira Import — Async JQL-based import job... idempotent upsert of stories + ACs")
- Confidence: Medium

### Value Propositions
- Reusable, anchored test components (ATCs) instead of one-off test scripts — enforced structurally via the FK-backed anchoring moat (Source: `supabase/migrations/0004_atcs.sql`)
- Hierarchical test-suite organization mirroring the application under test, via a self-referential `modules` tree, max depth 6 (Source: `supabase/migrations/0002_projects_modules.sql`)
- Snapshot-consistent execution history: a `Run` snapshots the Test's ATC chain and each step's content at start time, so later edits to the source ATC never retroactively change what a historical Run says was executed (Source: `supabase/migrations/0031_runs.sql`, comment: *"run_atcs — snapshot of each chain position at start"* / *"run_steps — snapshot of each executable step at start"*)
- Confidence: High — directly evidenced by schema design, not inferred

### Channels
- Web application (Next.js App Router UI) — primary channel
- Headless/API channel for CI and AI agents via Bearer PAT auth (`bk_pat_<prefix>.<secret>`), distinct from the browser cookie-session flow (Found in: `business-feature-map.md` §2.1 "Auth methods" table)
- OpenAPI spec + Scalar interactive docs at `/api/docs` for third-party/API-first integration (Found in: `business-feature-map.md` §1, "API Documentation")
- Confidence: High

### Customer Relationships
- Self-service signup/onboarding: magic-link and headless signup/signin flows, an in-app `/onboarding` workspace-creation flow (Found in: `business-feature-map.md` §2.1–2.2)
- No sales-assisted or support-touch signal found in the code (no CRM/support integration in `package.json`)
- Confidence: Medium

### Revenue Streams
- Unknown — requires user input. The `workspaces.plan` column models `community`/`cloud`/`enterprise` tiers, but no billing integration (Stripe/Paddle/LemonSqueezy) appears in `package.json` dependencies, and no pricing page route was found.

### Key Resources
- The Postgres schema itself (RLS-first, SECURITY DEFINER RPC pattern for every multi-step write) is the primary technical asset — every state-changing operation with cross-table invariants goes through a `bunkai_*` function (e.g. `bunkai_create_test`, `bunkai_create_run`, `bunkai_finish_run`) rather than raw client inserts (Source: `supabase/migrations/0024_tests.sql`, `0031_runs.sql`, `0037_run_finish.sql`)
- Confidence: High

### Key Activities
- Authoring: modules, user stories, acceptance criteria, ATCs (Found in: `business-feature-map.md` §2.5–2.7, inferred from table names)
- Assembling: Tests (named ordered chains of ATC references) (Source: `supabase/migrations/0024_tests.sql`)
- Executing: Runs (snapshot-based execution against a `project_environments` target, with `human`/`agent`/`ci` executor modes) (Source: `supabase/migrations/0031_runs.sql`)
- Importing existing backlog from Jira (Found in: `business-feature-map.md` §1, "Jira Import")
- Confidence: High

### Key Partners
- Supabase (auth + Postgres hosting) — `@supabase/ssr`, `@supabase/supabase-js` (Source: `package.json` dependencies)
- Vercel (inferred hosting, `POSTGRES_*` Vercel-Postgres-shaped env vars in `.env.example`, `*.vercel.app` domain convention)
- Jira/Atlassian (import integration) (Found in: `business-feature-map.md` §1)
- Resend (`RESEND_API_KEY` in `.env.example`) — likely transactional email, though `business-feature-map.md` notes "Email notifications: NOT implemented in MVP" for invites, so this may be reserved for future use or used elsewhere
- Confidence: Medium

### Cost Structure
- Unknown in detail — requires user input for actual infra spend. Structurally implied costs: Supabase Postgres + Auth hosting, Vercel compute/hosting, third-party API costs (Resend, Tavily per `.env.example` `TAVILY_API_KEY`, n8n per `N8N_API_URL`/`N8N_API_KEY`)
- Confidence: Low

## 3. Discovery Gaps

- Revenue model / pricing: Unknown — `plan` field exists on `workspaces` but no billing integration found.
- Cost structure detail: Unknown — no infra-spend or usage-metering code found.
- Target market sizing / go-to-market: Unknown — no marketing copy exists in this repo to cite (the README is the shared boilerplate's, not Bunkai's).
- Defect/Bug tracking as an in-product entity: **not yet implemented** in the schema — no `defects`/`bugs` table exists in any of the 37 migrations at time of discovery. `business-feature-map.md` (generated 2026-06-08, before Runs shipped) lists "Defect Management — Not yet implemented" and this still holds true after re-checking the full migration list through 0037. Quality issues for Bunkai-the-product are currently tracked externally in this QA repo's own Jira workflow (BK-* tickets), not inside the Bunkai app itself.
- Reporting / ROI features: **not yet implemented** — confirmed absent from route tree (`app/` has no `reports` or `analytics` route) and no migration adds aggregate/reporting tables.
- `N8N_API_URL` / `N8N_API_KEY` in `.env.example`: purpose not confirmed — no n8n-related code found in a surface-level pass; may be a leftover from the shared boilerplate template rather than Bunkai-specific.

## 4. QA Relevance

| Business aspect | Testing implication |
|---|---|
| Multi-tenant workspace boundary (RLS on every table) | Every ATC/Test-automation suite must test cross-tenant isolation (workspace A member cannot read/write workspace B's data) as a first-class security test category, not an afterthought |
| Anchoring moat (ATC must bind to ≥1 AC) | Test-design work for ATC-creation endpoints must cover the "0 AC bound" rejection path explicitly (EP/BVA boundary at exactly 1 AC) |
| Run snapshot model (edits to source ATC don't retroactively change history) | Regression tests must verify a Run's `run_steps.content` stays frozen even after the parent `atc_steps.content` is edited post-Run — a classic "snapshot vs. live reference" bug class |
| Dual auth (cookie session vs. Bearer PAT) | Every protected endpoint needs both an authenticated-browser test path and a PAT/headless test path — they hit different code branches (`auth.uid()` vs. explicit `p_actor_user_id`) |
| Custom SQLSTATE error codes on RPCs (e.g. `45120`–`45207`) | API-layer test design should assert on the specific error code / HTTP status mapping, not just "request failed" — these are deliberate, documented contract surfaces |
| No CI/CD in target repo | `/regression-testing` Stage 6 cannot yet run against a hosted pipeline for this repo — regression suites currently depend on local/manual execution until a workflow exists |

## 5. Sources Used

- `../upex-bunkai-tms/supabase/migrations/0001_tenancy.sql` — workspaces/workspace_members schema + RLS
- `../upex-bunkai-tms/supabase/migrations/0002_projects_modules.sql` — projects/modules schema
- `../upex-bunkai-tms/supabase/migrations/0004_atcs.sql` — ATC anchoring moat comment + schema
- `../upex-bunkai-tms/supabase/migrations/0024_tests.sql` — Test/test_steps + `bunkai_create_test` RPC
- `../upex-bunkai-tms/supabase/migrations/0031_runs.sql` — Run/run_atcs/run_steps snapshot model + `bunkai_create_run` RPC
- `../upex-bunkai-tms/supabase/migrations/0037_run_finish.sql` — `bunkai_finish_run` RPC
- `../upex-bunkai-tms/package.json` — dependency list (Supabase, Zod, OpenAPI tooling)
- `../upex-bunkai-tms/.env.example` — third-party integration env vars (Resend, Tavily, n8n, Supabase, Postgres/Vercel)
- `../upex-bunkai-tms/app/**` route tree (via `find`) — feature surface confirmation
- This QA repo's `.context/business/business-data-map.md` (previously generated against the same target, 2026-06-08 dataset) — cross-referenced, not copied blindly
- This QA repo's `.context/business/business-feature-map.md` (previously generated against the same target, 2026-06-08 dataset) — cross-referenced, not copied blindly; re-verified the "Defect Management not yet implemented" and "Runs not yet implemented" claims against the current (through migration 0037) schema — Runs have since shipped, Defects have not

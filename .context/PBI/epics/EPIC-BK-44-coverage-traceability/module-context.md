# Module Context — EPIC-BK-44: Coverage & Traceability

> Hand-authored, NON-Jira. Persists across every BK-44 story (BK-45..BK-50). Reusable — skip re-exploration on the next ticket in this module unless code has moved.

## Module purpose

Read-side reporting surfaces over the core TMS entity graph (User Story → Acceptance Criterion → ATC → Test → Run → Defect). No write paths in this epic — every story here is a report / view over data owned by other epics (BK-13 ATC Library, BK-24 Tests, BK-30 Runs, BK-31 Defects).

## Repo

Frontend + backend are the same Next.js app: `{{FRONTEND_REPO}}` = `../upex-bunkai-tms` (Next.js + Supabase + Vercel). Code lives on branch `staging` (not `main` in the local checkout at session time — verify via `git ls-tree origin/staging` or fetch, do not assume the local working tree is current).

## Routes discovered (BK-44 family)

| Story | Route | Notes |
|---|---|---|
| BK-45 (this session) | `/projects/[projectSlug]/traceability?story={userStoryId}` | New; project-scoped, deep-linkable. Sub-nav entry added. |
| BK-46 (coverage) | `/projects/[projectSlug]/metrics` (coverage section) | Sibling report, same layout shell |
| BK-47 (time-to-green) | `/projects/[projectSlug]/metrics` (recovery-cycle section) | Sibling report |

All BK-44 report screens sit inside the existing `[projectSlug]` layout — `ProjectShell` (sidebar/topbar/explorer) is already mounted; each story's page renders only the content slot.

## API endpoints (BK-45)

- `GET /api/v1/projects/{id}/traceability?story={userStoryId}` — headless read, same RPC as the SSR page. Auth required, no extra scope check (any active workspace role incl. viewer passes). Returns 404 `not_found` for: missing story, foreign-workspace story, non-member — never a 403, never an existence echo (non-disclosure by design, matches sibling report routes' `mapXRpcError` pattern).
- `app/api/v1/projects/[id]/traceability/route.openapi.ts` — OpenAPI schema companion (read via OpenAPI MCP for schema, not for execution).

## Database (BK-45)

- Migration: `supabase/migrations/0068_story_traceability_report.sql` — one `SECURITY DEFINER` RPC `bunkai_report_story_traceability(p_actor_user_id uuid, p_user_story_id uuid) returns jsonb`, plus `create index bugs_atc_id_idx on bugs (atc_id) where atc_id is not null`.
- Scope resolution: `user_stories.module_id -> modules.project_id` (never the nullable `user_stories.project_id`).
- Key tables touched: `user_stories`, `acceptance_criteria`, `atcs`, `atc_acceptance_criteria` (M:N, no project/workspace column — the AC×ATC join is the sole cross-project guard), `run_atcs`, `runs`, `bugs`.
- `runs` "latest" ordering: `(started_at desc, id desc)` — total + stable, rides existing indexes (`runs_test_id_status_started_at_idx` 0038, `runs_project_id_status_started_at_idx` 0041).
- Archived filtering (3 predicates, belt-and-braces): own `archived_at`, own module's `archived_at`, no archived ancestor (path-prefix check against `modules.path`). Verified zero orphan ATCs in production at ratification time (2026-08-05).

## Key entities for testing

- **User Story** (`draft` | `ready_to_test`, `archived_at`)
- **Acceptance Criterion** (`archived_at`, `position`)
- **ATC** (`layer`: UI/API/Unit, `archived_at`) — bound to AC via M:N; immutable `user_story_id` per ADR-0009 (an ATC belongs to exactly one story for life)
- **Run** (`status`: running/passed/failed/aborted; `started_at`/`finished_at`)
- **Defect/Bug** (`atc_id` is the scoping key, NOT `run_id` alone — prevents cross-story leak per EC9; `severity` P1-P4, `status` open/in_progress/resolved/closed)

## Session log

- 2026-08-07 (BK-45 Session Start): explored `page.tsx`, `route.ts`, `TraceabilityChainView.tsx`, `chain-view.ts`, `errors.ts` on `origin/staging`. Local working tree was on an unrelated branch (`fix/BK-175/...`) — used `git show origin/staging:<path>` rather than checking out, to stay read-only during Session Start.

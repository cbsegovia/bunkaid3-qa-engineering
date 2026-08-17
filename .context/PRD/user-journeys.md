# Bunkai TMS — User Journeys

> Generated: 2026-08-14 by `/project-discovery` Phase 2, PRD sub-step 3.
> Method: routes = journey steps, redirects = transitions, mapped from `app/(app)/**`, `app/(auth)/**`, `app/api/v1/**` in `../upex-bunkai-tms`.
> **Discrepancy notice**: the target's own internal `.context/PRD/user-journeys.md` documents three aspirational journeys (first-time setup with an empty-state dashboard + Cmd+K palette, manual run with a bug-filing side drawer + defect heatmap, and an AI-agent journey referencing WebSocket/SSE streaming and native `/api/v1/bugs`). None of a dashboard-with-stat-cards, bug-filing drawer, defect heatmap, command palette, or `/api/v1/bugs` endpoint were found in the actual route tree or migrations. The journeys below are reconstructed strictly from the routes and RPCs that exist today.

---

## Route Map

### Public Routes (Unauthenticated)

| Route | Page | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Landing/root page |
| `/(auth)/login` | `app/(auth)/login/page.tsx` | Sign-in (magic-link / headless) |
| `/auth/callback` | `app/auth/callback` | Supabase OTP/OAuth callback handler |
| `/auth/oauth/[provider]` | `app/auth/oauth/[provider]` | OAuth provider entry (stub — backend wiring not fully confirmed) |
| `/invites/accept` | `app/invites/accept/page.tsx` | Accept a workspace invite by token |
| `/api/docs` | `app/api/docs/page.tsx` | Scalar interactive OpenAPI docs UI |
| `/qa` | `app/qa/page.tsx` | QA testability guide (stack config, auth snippets, Playwright fixtures) |
| `/design-tokens` | `app/design-tokens/page.tsx` | Design-token reference page |

### Protected Routes (Authenticated)

| Route | Page | Requires (role) | Purpose |
|---|---|---|---|
| `/(app)/onboarding` | `app/(app)/onboarding/page.tsx` | Any authenticated user, no workspace yet | First-workspace creation flow |
| `/(app)/projects` | `app/(app)/projects/page.tsx` | `member`+ in active workspace | Project list + create |
| `/(app)/projects/[projectSlug]` | `.../page.tsx` | `member`+ | Project explorer (Module tree + ATC table) |
| `/(app)/projects/[projectSlug]/atcs/new` | `.../atcs/new/page.tsx` | `member`+ | Create ATC form |
| `/(app)/projects/[projectSlug]/atcs/[atcId]` | `.../atcs/[atcId]/page.tsx` | `member`+ | ATC detail/edit |
| `/(app)/projects/[projectSlug]/tests/new` | `.../tests/new/page.tsx` | `member`+ | Create Test (assemble ATC chain) |
| `/(app)/projects/[projectSlug]/tests/[testId]` | `.../tests/[testId]/page.tsx` | `member`+ | Test detail (chain + Run history) |
| `/(app)/projects/[projectSlug]/runs/[runId]` | `.../runs/[runId]/page.tsx` | `member`+ | Run execution / result screen |
| `/(app)/workspaces/[id]/members` | `.../members/page.tsx` | `admin`/`owner` for mutation, `member`+ for read | Membership + invite management |

### Dynamic Routes

| Pattern | Example | Purpose |
|---|---|---|
| `/projects/[projectSlug]` | `/projects/checkout-app` | Project addressed by slug, unique per workspace |
| `/projects/[projectSlug]/atcs/[atcId]` | `/projects/checkout-app/atcs/atc1...` | ATC addressed by UUID |
| `/projects/[projectSlug]/tests/[testId]` | `/projects/checkout-app/tests/t1...` | Test addressed by UUID |
| `/projects/[projectSlug]/runs/[runId]` | `/projects/checkout-app/runs/r1...` | Run addressed by UUID |
| `/workspaces/[id]` | `/workspaces/b1c2d3e4-...` | Workspace addressed by UUID |
| `/auth/oauth/[provider]` | `/auth/oauth/github` | OAuth provider selector |

---

## Journey 1 — First-time setup: sign-in to first ATC

### Persona + Goal + Discovered From

Workspace Member (QA Engineer) — goal: get from an account to one authored, AC-anchored ATC. Discovered from `app/(auth)/login`, `app/(app)/onboarding`, `app/(app)/projects/**`, `app/(app)/projects/[projectSlug]/atcs/new`.

### Flow Diagram

```mermaid
flowchart LR
    A[/login] -->|magic-link or headless signin| B[/auth/callback]
    B --> C{Has workspace?}
    C -->|No| D[/onboarding]
    D -->|bunkai_bootstrap_workspace RPC| E[/projects]
    C -->|Yes| E
    E -->|Create Project| F[/projects/:slug]
    F -->|Create Module| G[Module tree populated]
    G -->|Create User Story + AC| H[AC recorded]
    H -->|atcs/new, bind to AC| I[ATC created]
```

### Step-by-Step Flow

| Step | Page | Action | Next | Evidence (file:line) |
|---|---|---|---|---|
| 1 | `/login` | Submit email for magic-link OR headless email+password | `/auth/callback` (browser) or immediate session (headless) | `app/(auth)/login/page.tsx`; `app/api/v1/auth/magic-link`, `app/api/v1/auth/signin` |
| 2 | `/auth/callback` | Supabase verifies OTP/OAuth token, sets session cookie | Redirect to `/onboarding` or `/projects` | `app/auth/callback` |
| 3 | `/onboarding` | Create first Workspace (name/slug) | `/projects` | `app/(app)/onboarding/page.tsx`; RPC `bunkai_bootstrap_workspace` auto-enrolls creator as `owner` |
| 4 | `/projects` | Create Project (name → slug via `slugify()`) | `/projects/[projectSlug]` | `POST /api/v1/workspaces/{id}/projects` |
| 5 | `/projects/[projectSlug]` | Create Module (root or nested, ≤ depth 6) | Module node appears in tree | `POST /api/v1/projects/{id}/modules`; `supabase/migrations/0002_projects_modules.sql` |
| 6 | `/projects/[projectSlug]` | Create User Story + Acceptance Criteria under the Module | AC available to bind | `app/api/v1/user-stories`, `app/api/v1/acceptance-criteria`; `0003_authoring.sql` |
| 7 | `/projects/[projectSlug]/atcs/new` | Fill ATC (title, layer, steps, assertions), bind to ≥1 AC | ATC saved via `bunkai_save_atc` RPC | `supabase/migrations/0007_save_atc.sql`, `0021_atc_create_update.sql`; `lib/atcs/validation.ts` (`acceptance_criterion_ids: z.array(z.string().uuid()).min(1)`) |

### Error Paths

| Error | Handling | Evidence |
|---|---|---|
| ATC submitted with zero AC bindings | Rejected by Zod `min(1)` before any DB round-trip; RPC-level anchoring moat is the structural backstop | `lib/atcs/validation.ts` line 41 |
| Module depth exceeds 6 | Rejected by CHECK constraint on materialized `path` | `supabase/migrations/0002_projects_modules.sql` |
| Reserved workspace slug (`admin`, `api`, `app`, ...) | Rejected at validation | `business-feature-map.md` §2.2 reserved-slug list |
| Session cookie missing/expired on a protected route | Redirect to `/login?next=...` | `business-feature-map.md` §2.1 "Protected routes (middleware)" |

### Success Criteria checklist

- [ ] User reaches `/projects/[projectSlug]` with ≥1 Module, ≥1 User Story, ≥1 Acceptance Criterion, ≥1 ATC bound to that AC.
- [ ] ATC save is rejected end-to-end (client + server) when 0 ACs are selected.

---

## Journey 2 — Assemble a Test and execute a Run

### Persona + Goal + Discovered From

Workspace Member (QA Engineer) — goal: chain existing ATCs into a Test, run it against an environment, and record a verdict. Discovered from `app/(app)/projects/[projectSlug]/tests/**`, `app/(app)/projects/[projectSlug]/runs/[runId]`.

### Flow Diagram

```mermaid
flowchart LR
    A[/projects/:slug/tests/new] -->|select ATCs, order chain| B[Test created]
    B --> C[/projects/:slug/tests/:testId]
    C -->|Start Run, pick environment| D[Run: status=running]
    D --> E[/projects/:slug/runs/:runId]
    E -->|execute steps| F{All steps done?}
    F -->|finish verdict| G[Run: passed/failed]
    F -->|abort with reason| H[Run: aborted]
```

### Step-by-Step Flow

| Step | Page | Action | Next | Evidence (file:line) |
|---|---|---|---|---|
| 1 | `/projects/[projectSlug]/tests/new` | Select ≥1 ATC, order the chain | Test created | `POST` handler calling `bunkai_create_test`; `supabase/migrations/0024_tests.sql` |
| 2 | `/projects/[projectSlug]/tests/[testId]` | Click "Start Run", pick target `project_environments` row | Run created, `status=running` | `bunkai_create_run` RPC; `lib/runs/validation.ts` (`RunCreateBodySchema`) |
| 3 | `/projects/[projectSlug]/runs/[runId]` | Execute each snapshotted `run_step`, record pass/fail/block/skip | Progress updates | `supabase/migrations/0031_runs.sql` (`run_atcs`, `run_steps`) |
| 4a | `/projects/[projectSlug]/runs/[runId]` | Click "Finish" with verdict `passed`/`failed` | Run status finalized | `bunkai_finish_run`; `lib/runs/validation.ts` (`RunFinishBodySchema`, `RUN_FINISH_VERDICTS`) |
| 4b | `/projects/[projectSlug]/runs/[runId]` | Click "Abort" with a 3–500 char reason | Run status = `aborted` | `bunkai_abort_run`; `supabase/migrations/0036_run_abort.sql`; `lib/runs/validation.ts` (`RunAbortBodySchema`) |

### Error Paths

| Error | Handling | Evidence |
|---|---|---|
| Test chain submitted empty | `chain_empty`, SQLSTATE `45120`, HTTP 422 | `supabase/migrations/0024_tests.sql` lines 203–206 |
| Test chain references an ATC outside the caller's workspace | `atc_not_in_workspace`, SQLSTATE `45122` — uniform error, no id echoed (non-disclosure) | `0024_tests.sql` lines 208–225 |
| Run started with no executable steps, or against an environment outside the Test's project | `no_executable_steps` / `environment_invalid`, HTTP 422 | `lib/api/error-envelope.ts` |
| Second finish/abort attempt on an already-terminal Run | `run_not_finishable`, SQLSTATE `45206`, modeled as HTTP 409 | `supabase/migrations/0037_run_finish.sql` lines 39–43 |
| Abort reason too short/long | AC-exact frozen message surfaced verbatim, not the generic Zod envelope | `lib/runs/validation.ts` (`RUN_ABORT_REASON_TOO_SHORT_MESSAGE`/`_TOO_LONG_MESSAGE`) |

### Success Criteria checklist

- [ ] A Test with ≥1 ATC in its chain can start a Run against a Project-scoped environment.
- [ ] A completed Run's `run_steps.content` remains frozen even after the source ATC is later edited (snapshot-immutability regression class).
- [ ] A Run cannot be finished/aborted twice.

---

## Journey 3 — Workspace governance: invite a teammate

### Persona + Goal + Discovered From

Workspace Owner/Admin (QA Lead) — goal: bring a teammate into the workspace with the correct role. Discovered from `app/(app)/workspaces/[id]/members/page.tsx`, `app/invites/accept/page.tsx`.

### Flow Diagram

```mermaid
flowchart LR
    A[/workspaces/:id/members] -->|Issue invite email+role| B[Invite created, token minted]
    B -->|token + accept_url shown once| C[Invitee receives link out-of-band]
    C --> D[/invites/accept]
    D -->|POST token| E{Email matches + role check}
    E -->|OK| F[workspace_members upserted, status=active]
    E -->|conflict| G[reject_already_member]
```

### Step-by-Step Flow

| Step | Page | Action | Next | Evidence (file:line) |
|---|---|---|---|---|
| 1 | `/workspaces/[id]/members` | Owner/Admin issues invite (email + role) | Invite row created, token+accept_url returned once | `POST /api/v1/workspaces/{id}/invites`; token stored hashed in `workspace_invite_secrets` |
| 2 | (out-of-band) | Invitee receives the accept URL (no email send in MVP — copied/relayed manually) | Invitee opens `/invites/accept?token=...` | `business-feature-map.md` §2.3 "Email notifications: NOT implemented in MVP" |
| 3 | `/invites/accept` | Invitee submits the token | `workspace_members` row upserted, `status='active'` | `lib/workspaces/invites.ts` (`inviteAcceptAction`) |

### Error Paths

| Error | Handling | Evidence |
|---|---|---|
| Invitee already has an equal-or-higher role in the workspace | `reject_already_member` — accept is a no-op conflict | `lib/workspaces/invites.ts` lines 14–22, `invites.test.ts` |
| Invite token expired (>7 days) | Accept rejected | `business-feature-map.md` §2.3 "Token expiry: 7 days" |
| Invite email doesn't match the authenticated user | Accept rejected | `business-api-map.md` Journey 2, "validate email match" step |

### Success Criteria checklist

- [ ] A lower-role invite over an existing higher-role membership is rejected, not silently downgraded.
- [ ] An unauthenticated visitor to `/invites/accept` is redirected to sign in before the token can be consumed.

---

## Navigation Structure

```mermaid
graph LR
    subgraph Public
        Login[/login]
        Callback[/auth/callback]
        InviteAccept[/invites/accept]
        Docs[/api/docs]
        QAGuide[/qa]
    end
    subgraph Authenticated
        Onboarding[/onboarding]
        Projects[/projects]
        ProjectDetail[/projects/:slug]
        ATCNew[/projects/:slug/atcs/new]
        ATCDetail[/projects/:slug/atcs/:id]
        TestNew[/projects/:slug/tests/new]
        TestDetail[/projects/:slug/tests/:id]
        RunDetail[/projects/:slug/runs/:id]
    end
    subgraph Admin
        Members[/workspaces/:id/members]
    end
    Login --> Callback --> Onboarding --> Projects
    Projects --> ProjectDetail --> ATCNew
    ProjectDetail --> ATCDetail
    ProjectDetail --> TestNew --> TestDetail --> RunDetail
    ProjectDetail --> Members
```

## Breadcrumb Patterns

No dedicated breadcrumb component was found in `components/layout/**` in this pass (Discovery Gap — not exhaustively audited). Route nesting itself implies the hierarchy: `Workspace → Projects → Project (:slug) → {ATCs|Tests|Runs} → entity detail`.

## Critical Paths

### Happy Paths (Must Work)

| Journey | Start | End | Business Impact |
|---|---|---|---|
| First ATC authored | `/login` | ATC saved, bound to ≥1 AC | Core value proposition (anchoring moat) |
| Test executed to verdict | `/projects/:slug/tests/:id` | Run `status = passed`/`failed` | Proves the product's execution lifecycle end-to-end |
| Teammate invited and activated | `/workspaces/:id/members` | `workspace_members.status = active` | Team-scale adoption depends on this working reliably |

### Unhappy Paths (Must Handle)

| Scenario | Expected Behavior | Evidence |
|---|---|---|
| ATC with 0 AC bindings | Rejected before persistence | `lib/atcs/validation.ts` line 41 |
| Test chain with a cross-workspace ATC id | Uniform non-disclosing 422, no id echoed | `0024_tests.sql` lines 208–225 |
| Double-finish a Run | 409-shaped rejection, first-terminal-action wins | `0037_run_finish.sql` lines 39–43 |
| Invite accept email mismatch | Rejected, no membership change | `business-api-map.md` Journey 2 |

## Discovery Gaps

| Flow | Unknown | Question |
|---|---|---|
| GitHub/Google OAuth sign-in | UI stub exists (`/auth/oauth/[provider]`) but end-to-end backend wiring not independently confirmed this pass | Trace `lib/auth/oauth.ts` handler completeness against a live OAuth attempt |
| Project rename/delete | No `PATCH`/`DELETE /api/v1/projects/{id}` route found — journey does not exist yet | Confirm with product owner whether this is planned or intentionally omitted |
| Coverage/traceability view journey (BK-44/45/50) | Confirmed to exist (`.context/PBI/epics/EPIC-BK-44-coverage-traceability/`) but its route was not located in the `app/` tree scanned this pass — may live under a path not enumerated (e.g. nested under `/projects/[projectSlug]`) | Locate the exact route serving the traceability/export feature before writing E2E specs against it |
| Any 2FA/MFA step | Not found in migrations or route tree | Confirm out of scope for MVP |

## QA Relevance

### Critical E2E Test Scenarios

| Priority | Scenario | Journey Reference |
|---|---|---|
| P0 | Create ATC with 0 AC bindings → rejected | Journey 1 |
| P0 | Full Run lifecycle: create → execute steps → finish (passed/failed) | Journey 2 |
| P0 | Double-finish/double-abort a Run → second attempt rejected | Journey 2 |
| P1 | Cross-workspace ATC id in a Test chain → uniform 422, no disclosure | Journey 2 |
| P1 | Invite accept with role conflict → rejected | Journey 3 |
| P2 | Module depth > 6 → rejected | Journey 1 |

### Suggested Test Data

| Journey | Test User | Prerequisites |
|---|---|---|
| Journey 1 | `member`-role account, per `.env.example` `LOCAL_USER_EMAIL`/`STAGING_USER_EMAIL` | At least one Workspace, one Project already provisioned or created inline |
| Journey 2 | Same `member` account | An existing ATC + Test + a seeded `project_environments` row (Staging) |
| Journey 3 | `owner`/`admin`-role account — **needs creation**, no such fixture in `.env.example` today | A second throwaway invitee email/account to accept the invite |

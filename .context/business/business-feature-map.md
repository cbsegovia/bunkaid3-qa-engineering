# BUNKAI TMS — Business Feature Map

> **Generated**: 2026-06-08
> **Source repo**: `C:\Users\benja\desktop\project-dojo3\upex\upex-bunkai-tms` (Next.js 15 App Router + Supabase PostgreSQL 17)
> **Generator**: `/business-feature-map`
> **Cross-reference**: `.context/business/business-data-map.md`
> **Stack snapshot**: Next.js 15, React 19, Supabase SSR 0.10, Zod 4, Tailwind CSS 3, shadcn/ui, Monaco Editor, Scalar API docs, `bk_pat_*` Bearer PAT auth

---

## 1. Inventory Summary

| Category | Features | Status |
|---|---|---|
| Authentication | Magic-link, headless signup/signin, OAuth stubs | Active (OAuth = WIP stub) |
| Workspace Management | Create, read, update workspace; active workspace switching | Active |
| Workspace Membership | Invite by email+role, accept, resend, revoke | Active |
| Project Management | Create project, list projects, project explorer UI | Active |
| Module Management | Create, rename, move, soft-delete, nested tree (max depth 6) | Active |
| User Story Management | Create, read, update (title/description/status/Jira key), soft-archive | Active |
| Acceptance Criteria | Create, read, update (title/detail/position), reorder, soft-archive | Active |
| ATC Library | Create ATC via `bunkai_save_atc` RPC, view/edit steps + assertions + AC bindings, table view | Active (UI = partial) |
| Jira Import | Async JQL-based import job, polling, idempotent upsert of stories + ACs | Active |
| Personal Access Tokens | Mint PAT (session or headless), list PATs, revoke PAT | Active |
| API Documentation | OpenAPI JSON spec, Scalar interactive docs UI | Active |
| QA Testability Guide | `/qa` page with stack config, auth snippets, Playwright fixtures | Active |
| Test Execution (Runs) | — | Not yet implemented (Sprint 2 stub) |
| Defect Management | — | Not yet implemented |
| Reporting / ROI | — | Not yet implemented |

---

## 2. Feature Catalog by Domain

---

### 2.1 Authentication

**Feature ID**: AUTH-001
**Status**: Active
**Domain**: Authentication

#### Capabilities

- [x] Magic-link (OTP) email login — `/api/v1/auth/magic-link` (POST)
- [x] Auth callback + open-redirect guard — `/auth/callback`
- [x] Headless signup (provisions password user, skips email confirmation, mints PAT) — `/api/v1/auth/signup` (POST)
- [x] Headless signin (email + password → session + PAT) — `/api/v1/auth/signin` (POST)
- [x] Session cookie refresh via `@supabase/ssr` middleware
- [x] Redirect to `/login?next=...` for protected routes
- [ ] GitHub OAuth — UI stub visible, backend not wired
- [ ] Google OAuth — UI stub visible, backend not wired
- [ ] SSO — noted as future sprint

**Protected routes** (middleware): `/projects/*`, `/onboarding`
**Public routes**: `/login`, `/auth/*`, `/api/auth/*`

**Auth methods**:
| Method | Token form | Used by |
|---|---|---|
| Cookie session | `sb-<project-ref>-auth-token` httpOnly | Browser, magic-link users |
| Bearer PAT | `bk_pat_<prefix>.<secret>` | Headless CLI, agents, CI |

**Magic-link audit trail**: `magic_link_tokens` + `magic_link_token_secrets` (SHA-256 of token, ip_hash, user-agent). Write is best-effort (never fails the auth flow).

---

### 2.2 Workspace Management

**Feature ID**: WS-001
**Status**: Active
**Domain**: Workspace

#### Capabilities

- [x] Create workspace — `POST /api/v1/workspaces` (calls `bunkai_bootstrap_workspace` RPC; auto-enrols creator as owner)
- [x] List workspaces the caller belongs to — `GET /api/v1/workspaces`
- [x] Read single workspace — `GET /api/v1/workspaces/{id}`
- [x] Rename workspace (owner-only via RLS) — `PATCH /api/v1/workspaces/{id}`
- [x] Workspace onboarding flow — `/onboarding` page with `OnboardingForm` component
- [x] Active workspace switching — `POST /api/v1/me/active-workspace` sets `bk_active_ws` httpOnly cookie
- [x] WorkspaceSwitcher UI component in Topbar

**Slug rules**: lowercase letters/digits/hyphens, 3–40 chars, no leading/trailing hyphen. Reserved slugs: `admin`, `api`, `app`, `auth`, `docs`, `invites`, `login`, `logout`, `onboarding`, `projects`, `public`, `qa`, `settings`, `static`, `workspaces`, `_next`.

**Plans**: `community` | `cloud` | `enterprise` (field exists, billing logic not implemented).

---

### 2.3 Workspace Membership & Invites

**Feature ID**: WS-002
**Status**: Active
**Domain**: Workspace

#### Capabilities

- [x] Issue invite for email+role — `POST /api/v1/workspaces/{id}/invites` (admin/owner-gated via RLS)
- [x] List pending/accepted/revoked/expired invites — `GET /api/v1/workspaces/{id}/invites`
- [x] Accept invite by raw token — `POST /api/v1/invites/accept` (email must match, upserts workspace_members)
- [x] Resend invite (rotate token + expiry) — `POST /api/v1/workspaces/{id}/invites/{inviteId}`
- [x] Revoke invite — `DELETE /api/v1/workspaces/{id}/invites/{inviteId}`
- [x] Members & Invites page — `/workspaces/{id}/members` with `MembersClient` component
- [x] Invite accept UI page — `/invites/accept`

**Roles**: `viewer` | `member` | `admin` | `owner`
**Member statuses**: `active` | `invited` | `suspended`
**Invite statuses** (derived at read time): `pending` | `accepted` | `revoked` | `expired`
**Token expiry**: 7 days. Token secret stored as SHA-256 in `workspace_invite_secrets` (separate table, QA roles cannot read).
**Email notifications**: NOT implemented in MVP. Token + accept_url returned in API response body once; logged to server console.

---

### 2.4 Project Management

**Feature ID**: PROJ-001
**Status**: Active
**Domain**: Project

#### Capabilities

- [x] Create project within workspace — `POST /api/v1/workspaces/{id}/projects`
- [x] List projects for active workspace — rendered in `/projects` page (direct DB query, no list API endpoint)
- [x] Projects index page — `/projects` with `CreateProjectForm` + projects list
- [x] Project detail page — `/projects/{projectSlug}` with full explorer + ATC table

**Slug**: auto-derived from project name via `slugify()`. Unique per workspace (constraint `projects(workspace_id, slug)`).
**Validation**: name 3–80 chars, must contain alphanumeric, description max 5 KB.
**No DELETE/PATCH project endpoint** in current codebase (discoverable gap).

---

### 2.5 Module Management

**Feature ID**: MOD-001
**Status**: Active
**Domain**: Module (hierarchical test suite tree)

#### Capabilities

- [x] Create module (root or nested) — `POST /api/v1/projects/{id}/modules`
- [x] Create nested module via `parent_module_id` — depth enforced: max 6 levels
- [x] Rename module (+ rebuilds materialized path for all descendants) — `PATCH /api/v1/modules/{id}` with `p_name`
- [x] Edit module description (Markdown, sanitized) — `PATCH /api/v1/modules/{id}` with `description`
- [x] Move module to new parent — `PATCH /api/v1/modules/{id}` with `parent_module_id` (calls `bunkai_move_module` RPC; cycle/depth/cross-project guarded)
- [x] Soft-delete module + cascade (archives module subtree, linked user stories, ACs, ATCs) — `DELETE /api/v1/modules/{id}` (calls `bunkai_archive_module_subtree` RPC)
- [x] Module tree UI — `ProjectExplorer` component, `buildModuleTree` utility
- [x] Create module form in UI — `create-module-form.tsx`
- [x] Rename module form in UI — `rename-module-form.tsx`
- [x] Delete module dialog in UI — `delete-module-dialog.tsx`
- [x] Move module dialog in UI — `move-module-dialog.tsx`

**Materialized path**: `modules.path` is slash-separated segment string (e.g. `payment/refunds`). No leading slash. Unique per `(project_id, path)`.
**Position**: integer for sibling ordering, auto-incremented at create.
**Archive cascade**: `bunkai_archive_module_subtree` archives the module + all descendants + their user_stories + acceptance_criteria + atcs in a single transaction.

---

### 2.6 User Story Management

**Feature ID**: US-001
**Status**: Active
**Domain**: User Story

#### Capabilities

- [x] Create user story in a module — `POST /api/v1/modules/{id}/user-stories`
- [x] List active stories in a module — `GET /api/v1/modules/{id}/user-stories`
- [x] Read single story — `GET /api/v1/user-stories/{id}`
- [x] Update story title — `PATCH /api/v1/user-stories/{id}`
- [x] Update story description (Markdown, sanitized) — `PATCH /api/v1/user-stories/{id}`
- [x] Link Jira key (one-time; immutable once set) — `PATCH /api/v1/user-stories/{id}` with `external_id`
- [x] Transition status: `draft` → `ready_to_test` — `PATCH /api/v1/user-stories/{id}` with `status` (calls `bunkai_set_user_story_status` RPC; gated: needs ≥1 active AC)
- [x] Transition status: `ready_to_test` → `draft` — automatic when last AC is archived
- [x] Soft-archive story — `DELETE /api/v1/user-stories/{id}`
- [x] User story form in UI — `user-story-form.tsx` (create + edit modes, Markdown editor)
- [x] Delete story dialog — `delete-user-story-dialog.tsx`

**Title**: max 200 chars, min 3 chars.
**Description**: Markdown, max 50 KB.
**Jira key format**: `LETTERS-NUMBER` (e.g. `BK-42`), uppercased on save. Unique per project (partial unique index, case-insensitive). Immutable once set (API returns 409 on change attempt).
**Status gate**: `bunkai_set_user_story_status` holds a row lock + re-counts active ACs atomically to prevent race conditions with concurrent AC archival.

---

### 2.7 Acceptance Criteria Management

**Feature ID**: AC-001
**Status**: Active
**Domain**: Acceptance Criteria

#### Capabilities

- [x] Add criterion to story — `POST /api/v1/user-stories/{id}/acceptance-criteria` (calls `bunkai_insert_acceptance_criterion` RPC; inserts at tail or explicit position, shifts siblings)
- [x] List active criteria in position order — `GET /api/v1/user-stories/{id}/acceptance-criteria`
- [x] Read single criterion — `GET /api/v1/acceptance-criteria/{id}`
- [x] Edit criterion title — `PATCH /api/v1/acceptance-criteria/{id}`
- [x] Edit criterion detail (Markdown, sanitized) — `PATCH /api/v1/acceptance-criteria/{id}`
- [x] Reorder criterion (atomic renumber) — `PATCH /api/v1/acceptance-criteria/{id}` with `position` (calls `bunkai_move_acceptance_criterion` RPC)
- [x] Soft-archive criterion — `DELETE /api/v1/acceptance-criteria/{id}` (calls `bunkai_archive_acceptance_criterion` RPC; also reverts parent story from `ready_to_test` → `draft` when last AC is removed)
- [x] Live AC panel in project UI — `acceptance-criteria-panel.tsx` (full inline CRUD with optimistic updates, reorder arrows)

**Title**: min 3 chars, max 200 chars.
**Detail**: Markdown, max 50 KB.
**Position**: 1-based integer. Unique per `(user_story_id, position)` for active ACs. Gaps closed on archive.

---

### 2.8 ATC (Acceptance Test Case) Library

**Feature ID**: ATC-001
**Status**: Active (UI partial — creation via editor only, no standalone Create button yet)
**Domain**: ATC Library

#### Capabilities

- [x] Save/update ATC (title, layer, tags, steps, assertions, AC bindings) — server action `saveAtcAction` → `bunkai_save_atc` RPC
- [x] ATC editor page — `/projects/{projectSlug}/atcs/{atcId}` with `AtcEditor` component
- [x] Monaco editor for step authoring (lazy-loaded) — `StepEditor` component
- [x] YAML-based assertion editing — parsed via `parseAssertionsYaml`
- [x] AC binding / anchoring panel — `AnchoringPanel` component
- [x] ATC table view on project page — `AtcTable` component (lists all active ATCs in project with module path)
- [x] ATCs loaded in project explorer tree (`ModuleTreeNode.atcs`)
- [x] ATC soft-delete (archived_at IS NULL filter on all reads) — DB cascade from module/story archive
- [x] ATC full-text search index — `atcs.tsv` GIN index over `title || tags` (backend ready, no UI search box yet)
- [ ] "New ATC" button — visible in UI but disabled ("ATC builder ships next sprint")
- [ ] "New Test" button — visible in UI but disabled
- [ ] ATC list endpoint (GET) — no standalone list API route for ATCs; UI reads via `supabase.from('atcs').select(*)` directly from page

**Layers**: `UI` | `API` | `Unit`
**Status field**: `pass` | `fail` | `blocked` | `skipped` | `running` | `unrun`
**Tags**: `text[]` with GIN index for prefix/fuzzy search.
**Steps schema**: `atc_steps(id, atc_id, position, content, input_data, expected)` — step content is Markdown bullet list, parsed by `parseStepsMarkdown`.
**Assertions schema**: `atc_assertions(id, atc_id, position, content)` — YAML format, parsed by `parseAssertionsYaml`.
**AC binding**: `atc_acceptance_criteria(atc_id, acceptance_criterion_id)` M:N. At least 1 AC binding required before save (enforced in `saveAtcAction`).

---

### 2.9 Jira Import

**Feature ID**: IMPORT-001
**Status**: Active
**Domain**: Jira Integration

#### Capabilities

- [x] Enqueue import job by JQL — `POST /api/v1/imports` (returns 202; at most one active job per project)
- [x] Poll import job status + counts + errors — `GET /api/v1/imports/{id}`
- [x] Background worker (Vercel `after()`) — `runImportJob` → `executeImport`
- [x] Paginated JQL search against Jira Cloud REST v3 — max 100 issues/page, max 1000 pages per job
- [x] ADF → Markdown conversion — `adfToMarkdown` (covers paragraph, heading, bulletList, orderedList, codeBlock, blockquote, hardBreak, text + marks)
- [x] Acceptance Criteria extraction from Markdown — `extractAcceptanceCriteria` (heuristic: numbered/bulleted items under AC sections)
- [x] Module routing by Jira component name (case-insensitive match) — unmatched issues routed to auto-created `Inbox` module
- [x] Idempotent upsert — updates title/description on re-run; never duplicates stories or ACs (keyed on `external_id`)
- [x] Truncation at 50 KB — with visible truncation marker in Markdown
- [x] Import-from-Jira dialog UI — `import-from-jira-dialog.tsx` with live polling (2s interval), per-job status badge, per-issue error list
- [x] Rate-limit handling (429 with exponential backoff + Retry-After header)

**Job statuses**: `queued` | `running` | `completed` | `failed`
**Credentials**: `ATLASSIAN_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` (server-only env vars, optional — missing triggers `jira_unauthorized` on the job, not a boot error).
**Serialization**: at most one `queued` or `running` job per project (partial unique index `0020`).

---

### 2.10 Personal Access Tokens (PAT)

**Feature ID**: TOKEN-001
**Status**: Active
**Domain**: API Authentication

#### Capabilities

- [x] Mint PAT (session-authenticated, from browser) — `POST /api/v1/tokens`
- [x] Mint PAT as part of headless signup — `POST /api/v1/auth/signup`
- [x] Mint PAT as part of headless signin — `POST /api/v1/auth/signin`
- [x] List caller's PATs (no secret) — `GET /api/v1/tokens`
- [x] Revoke PAT (soft-revoke, `revoked_at = now()`) — `DELETE /api/v1/tokens/{id}`
- [x] Bearer authentication on all `requireAuth` routes — `Authorization: Bearer bk_pat_*`

**Token format**: `bk_pat_<12-char-prefix>.<base64url-secret>`
**Entropy**: 32 random bytes (256 bits).
**Secret storage**: SHA-256 hash only, stored in `access_token_secrets` (separate table, QA roles cannot read `hash` column).
**Scopes**: `atc:read` | `atc:write` | `run:execute` | `workspace:admin`
**Expiry**: optional; max 365 days.
**Scope caveat**: `run:execute` and `workspace:admin` scopes are defined and issuable; routes that enforce them are not yet implemented (Sprint 2).

---

### 2.11 API Documentation

**Feature ID**: DOCS-001
**Status**: Active
**Domain**: Developer Experience

#### Capabilities

- [x] OpenAPI JSON spec auto-generated from route `.openapi.ts` files — `GET /api/openapi`
- [x] Scalar interactive docs UI — `GET /api/docs` (page.tsx renders `@scalar/api-reference-react`)
- [x] API version banner — `GET /api/v1` (returns version, openapi path, docs path)
- [x] Health liveness probe — `GET /api/v1/health` (returns `{ ok, service, env, ts }`)

---

### 2.12 QA Testability Guide

**Feature ID**: QA-001
**Status**: Active
**Domain**: Developer / QA Experience

#### Capabilities

- [x] `/qa` page — public, no auth gate
- [x] Stack summary (framework, DB, auth methods)
- [x] Auth method snippets (cookie, Bearer PAT, headless signup/signin)
- [x] PAT scope reference
- [x] Playwright scripted fixture for magic-link UI
- [x] UI → API bridge hybrid fixture (cookie → PAT mint)
- [x] MCP config blocks for DBHub, OpenAPI, Postman, Playwright (Claude + OpenCode)
- [x] DB role documentation (`qa_inspector_ro`, `qa_inspector_rw`, revoked columns)
- [x] Agentic prompts for exploratory testing

**Credentials source**: Jira Epic `BK-29` (credentials never inlined in UI).

---

### 2.13 User Identity (Me)

**Feature ID**: ME-001
**Status**: Active
**Domain**: Authentication / Profile

#### Capabilities

- [x] Get current user identity, workspace list, active workspace, auth scopes — `GET /api/v1/me` (supports both cookie and Bearer)
- [x] Switch active workspace — `POST /api/v1/me/active-workspace` (sets `bk_active_ws` httpOnly cookie, verifies membership)

---

## 3. CRUD Matrix

| Entity | Create | Read | Update | Delete (Archive) | Evidence |
|---|---|---|---|---|---|
| **Workspace** | POST /workspaces (RPC) | GET /workspaces, GET /workspaces/{id} | PATCH /workspaces/{id} (name only) | Not implemented | `0001_tenancy.sql`, route.ts |
| **WorkspaceMember** | POST /invites/accept (upsert) | workspaces/[id]/members page | Not exposed | Not implemented | `0010_workspace_invites.sql` |
| **WorkspaceInvite** | POST /workspaces/{id}/invites | GET /workspaces/{id}/invites | POST /workspaces/{id}/invites/{inviteId} (rotate) | DELETE /workspaces/{id}/invites/{inviteId} (revoke) | `0010_workspace_invites.sql` |
| **Project** | POST /workspaces/{id}/projects | /projects page, /projects/{slug} page | Not implemented | Not implemented | `0002_projects_modules.sql` |
| **Module** | POST /projects/{id}/modules | Project explorer tree (UI), project page | PATCH /modules/{id} (name/description/parent) | DELETE /modules/{id} (soft-archive cascade) | `0002_projects_modules.sql`, modules route |
| **UserStory** | POST /modules/{id}/user-stories | GET /modules/{id}/user-stories, GET /user-stories/{id} | PATCH /user-stories/{id} | DELETE /user-stories/{id} (soft-archive) | `0003_authoring.sql` |
| **AcceptanceCriterion** | POST /user-stories/{id}/acceptance-criteria | GET /user-stories/{id}/acceptance-criteria, GET /acceptance-criteria/{id} | PATCH /acceptance-criteria/{id} | DELETE /acceptance-criteria/{id} (soft-archive) | `0003_authoring.sql` |
| **ATC** | Via `bunkai_save_atc` RPC (editor page) | Project page ATC table, `/projects/{slug}/atcs/{id}` editor | Via `bunkai_save_atc` RPC | Cascades from module/story archive; no standalone delete API | `0004_atcs.sql`, `0007_save_atc.sql` |
| **AtcStep** | Via `bunkai_save_atc` | AtcEditor page | Via `bunkai_save_atc` (full replace) | Cascade from ATC | `0004_atcs.sql` |
| **AtcAssertion** | Via `bunkai_save_atc` | AtcEditor page | Via `bunkai_save_atc` (full replace) | Cascade from ATC | `0004_atcs.sql` |
| **atc_acceptance_criteria** | Via `bunkai_save_atc` | AtcEditor page (AnchoringPanel) | Via `bunkai_save_atc` (full replace) | Cascade from ATC or AC | `0004_atcs.sql` |
| **AccessToken (PAT)** | POST /tokens, POST /auth/signup, POST /auth/signin | GET /tokens | Not updatable | DELETE /tokens/{id} (soft-revoke) | `0008_access_tokens.sql` |
| **ImportJob** | POST /imports | GET /imports/{id} | Status + counts updated by background worker | Not implemented | `0019_import_jobs.sql` |
| **magic_link_tokens** | POST /auth/magic-link (best-effort) | Not exposed | — | — | magic-link route |

---

## 4. API Endpoint Inventory

### 4.1 Authentication

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/v1/auth/magic-link` | Trigger passwordless OTP email; records audit in magic_link_tokens | None |
| POST | `/api/v1/auth/signup` | Headless user provisioning + mint PAT (QA/CLI bootstrap) | None |
| POST | `/api/v1/auth/signin` | Email+password sign-in + mint PAT | None |
| GET/POST | `/auth/callback` | OTP exchange callback (Supabase redirect target) | None |

### 4.2 User Identity

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/api/v1/me` | Current user + workspaces + active workspace + auth scopes | Cookie or Bearer |
| POST | `/api/v1/me/active-workspace` | Switch active workspace (sets `bk_active_ws` cookie) | Cookie |

### 4.3 Workspace

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/api/v1/workspaces` | List caller's workspaces | Cookie or Bearer |
| POST | `/api/v1/workspaces` | Create workspace (auto-enrol creator as owner) | Cookie |
| GET | `/api/v1/workspaces/{id}` | Read single workspace | Cookie |
| PATCH | `/api/v1/workspaces/{id}` | Rename workspace (owner-only via RLS) | Cookie |
| POST | `/api/v1/workspaces/{id}/projects` | Create project within workspace | Cookie |
| GET | `/api/v1/workspaces/{id}/invites` | List workspace invites | Cookie |
| POST | `/api/v1/workspaces/{id}/invites` | Issue invite (admin/owner only) | Cookie |
| POST | `/api/v1/workspaces/{id}/invites/{inviteId}` | Rotate invite token (resend) | Cookie |
| DELETE | `/api/v1/workspaces/{id}/invites/{inviteId}` | Revoke invite | Cookie |

### 4.4 Invites

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/v1/invites/accept` | Accept invite by raw token; email must match | Cookie |

### 4.5 Module

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/v1/projects/{id}/modules` | Create module (root or nested) | Cookie |
| PATCH | `/api/v1/modules/{id}` | Rename, edit description, or move module | Cookie |
| DELETE | `/api/v1/modules/{id}` | Soft-archive module subtree | Cookie |

### 4.6 User Story

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/v1/modules/{id}/user-stories` | Create user story | Cookie |
| GET | `/api/v1/modules/{id}/user-stories` | List active stories in module | Cookie |
| GET | `/api/v1/user-stories/{id}` | Read single story | Cookie |
| PATCH | `/api/v1/user-stories/{id}` | Update title/description/Jira key/status | Cookie |
| DELETE | `/api/v1/user-stories/{id}` | Soft-archive story | Cookie |

### 4.7 Acceptance Criteria

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/v1/user-stories/{id}/acceptance-criteria` | Add criterion (with position insert RPC) | Cookie |
| GET | `/api/v1/user-stories/{id}/acceptance-criteria` | List active criteria in order | Cookie |
| GET | `/api/v1/acceptance-criteria/{id}` | Read single criterion | Cookie |
| PATCH | `/api/v1/acceptance-criteria/{id}` | Edit title/detail/position | Cookie |
| DELETE | `/api/v1/acceptance-criteria/{id}` | Soft-archive criterion (reverts story status if last AC) | Cookie |

### 4.8 Personal Access Tokens

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/v1/tokens` | Mint PAT (requires cookie session) | Cookie |
| GET | `/api/v1/tokens` | List caller's PATs (no secret) | Cookie |
| DELETE | `/api/v1/tokens/{id}` | Revoke PAT | Cookie |

### 4.9 Imports

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/api/v1/imports` | Enqueue Jira import job (JQL) | Cookie |
| GET | `/api/v1/imports/{id}` | Poll import job status + counts + errors | Cookie |

### 4.10 API Meta

| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/api/v1` | Version banner, openapi + docs pointers | None |
| GET | `/api/v1/health` | Liveness probe | None |
| OPTIONS | `/api/v1` | CORS preflight | None |
| GET | `/api/openapi` | OpenAPI JSON spec | None |
| GET | `/api/docs` | Scalar interactive docs UI | None |

---

## 5. UI Component Inventory

### 5.1 Pages (Next.js App Router)

| Route | Component | Purpose |
|---|---|---|
| `/login` | `LoginPage` | Magic-link auth form, brand panel, OAuth stubs |
| `/auth/callback` | (redirect handler) | OTP exchange + session hydration |
| `/onboarding` | `OnboardingPage` + `OnboardingForm` | First workspace creation |
| `/projects` | `ProjectsIndexPage` + `CreateProjectForm` | Project list + create form |
| `/projects/{slug}` | `ProjectPage` + `ProjectExplorer` + `AtcTable` | Project explorer tree + ATC table |
| `/projects/{slug}/atcs/{atcId}` | `AtcEditorPage` + `AtcEditor` | ATC step/assertion/AC-binding editor |
| `/workspaces/{id}/members` | `MembersPage` + `MembersClient` | Member list + invite management |
| `/invites/accept` | (accept page) | Invite acceptance UI |
| `/qa` | `QaPage` + `QaShell` | Software testability guide |

### 5.2 UI Components

| Component | File | Purpose |
|---|---|---|
| `ProjectExplorer` | `project-explorer.tsx` | Left-rail tree: modules → stories → ACs + inline CRUD |
| `AtcTable` | `components/atcs/AtcTable.tsx` | Right-panel ATC table for project page |
| `AtcEditor` | `components/atcs/AtcEditor.tsx` | ATC detail editor (title, layer, tags, story binding) |
| `StepEditor` | `components/atcs/StepEditor.tsx` | Monaco editor for step Markdown authoring |
| `AnchoringPanel` | `components/atcs/AnchoringPanel.tsx` | AC picker for ATC binding |
| `AcceptanceCriteriaPanel` | `acceptance-criteria-panel.tsx` | Live AC CRUD panel (fetch-on-open, reorder, edit, archive) |
| `UserStoryForm` | `user-story-form.tsx` | Create/edit user story (title, Markdown description, Jira key) |
| `CreateModuleForm` | `create-module-form.tsx` | New module inline form |
| `RenameModuleForm` | `rename-module-form.tsx` | Rename + description edit |
| `DeleteModuleDialog` | `delete-module-dialog.tsx` | Soft-delete confirm dialog |
| `MoveModuleDialog` | `move-module-dialog.tsx` | Move module to new parent |
| `DeleteUserStoryDialog` | `delete-user-story-dialog.tsx` | Story archive confirm dialog |
| `ImportFromJiraDialog` | `import-from-jira-dialog.tsx` | JQL entry + live job polling |
| `CommandPalette` | `components/layout/CommandPalette.tsx` | Keyboard-driven navigation |
| `Topbar` | `components/layout/Topbar.tsx` | Global top navigation bar |
| `WorkspaceSwitcher` | `components/layout/WorkspaceSwitcher.tsx` | Workspace + project breadcrumb switcher |
| `Sidebar` | `components/layout/Sidebar.tsx` | Left sidebar |
| `Wordmark` | `components/layout/Wordmark.tsx` | Bunkai brand mark |
| `MagicLinkForm` | `app/(auth)/login/magic-link-form.tsx` | Email OTP form |
| `MembersClient` | `members-client.tsx` | Invite issuance, resend, revoke + member list |
| `MarkdownEditor` | `components/markdown/markdown-editor.tsx` | Controlled Markdown textarea with byte counter |
| `MarkdownRenderer` | `components/markdown/markdown-renderer.tsx` | `react-markdown` + rehype-sanitize renderer |
| `QaShell` | `app/qa/_components/QaShell.tsx` | Testability guide renderer |

### 5.3 Forms (data-testid anchors confirmed)

| Form | Key data-testids |
|---|---|
| Login | `login-email`, `login-submit` |
| User Story | `user-story-form`, `user-story-title`, `user-story-description`, `user-story-jira-key`, `user-story-submit`, `user-story-cancel`, `user-story-error` |
| Jira Import | `import-from-jira-dialog`, `import-jql`, `import-start`, `import-cancel`, `import-status`, `import-status-badge`, `import-error`, `import-count-imported`, `import-count-created`, `import-count-updated`, `import-count-skipped`, `import-errors`, `import-close` |
| Projects list | `projects-list`, `projects-list-item-{slug}` |

---

## 6. Third-Party Integrations

| Service | Purpose | Package / Method | Status |
|---|---|---|---|
| Supabase Auth | User authentication (magic-link OTP, email+password) | `@supabase/ssr`, `@supabase/supabase-js` | Active |
| Supabase PostgreSQL 17 | Primary database + RLS enforcement | `@supabase/supabase-js` | Active |
| Jira Cloud REST v3 | Issue import via JQL (`/rest/api/3/search/jql`) | Native `fetch` with Basic auth | Active (optional, env-gated) |
| Scalar | OpenAPI interactive documentation UI | `@scalar/api-reference-react` | Active |
| Monaco Editor | Step authoring code editor in AtcEditor | `@monaco-editor/react` | Active |
| Vercel Fluid Compute (`after()`) | Background job execution for Jira import | `next/server` `after()` | Active |
| GitHub OAuth | Social login | UI stub (disabled button) | Not implemented |
| Google OAuth | Social login | UI stub (disabled button) | Not implemented |
| Transactional email | Invite delivery | Not configured | Not implemented (MVP logs link to console) |

---

## 7. Feature Flags and WIP

| Flag / Stub | Location | Current State | Notes |
|---|---|---|---|
| "New ATC" button | `app/(app)/projects/[projectSlug]/page.tsx` | `disabled + cursor-not-allowed + opacity-60` | "ATC builder ships next sprint" title text |
| "New Test" button | `app/(app)/projects/[projectSlug]/page.tsx` | `disabled + cursor-not-allowed + opacity-60` | "Test builder ships next sprint" title text |
| GitHub OAuth | `app/(auth)/login/page.tsx` | `disabled` button, title "OAuth ships next sprint" | No backend route |
| Google OAuth | `app/(auth)/login/page.tsx` | `disabled` button, title "OAuth ships next sprint" | No backend route |
| `run:execute` PAT scope | `lib/api/pat.ts` | Scope issuable, no routes enforce it | Planned Sprint 2 |
| `workspace:admin` PAT scope | `lib/api/pat.ts` | Scope issuable, no dedicated admin routes | Planned Sprint 2 |
| Workspace plans (`cloud`, `enterprise`) | `lib/types.ts`, `workspaces` table | Column exists, no billing logic | Future |
| Supabase JWT Secret | `lib/env.ts` | Optional in schema | Required for custom JWT claims feature |
| Multi-workspace project URLs | `app/(app)/projects/[projectSlug]/page.tsx` | Comment: "When multi-workspace lands, route shape becomes `/{workspaceSlug}/{projectSlug}`" | Post-MVP |
| ATC list API endpoint | `app/api/v1/` | No standalone `GET /api/v1/atcs` or `GET /api/v1/projects/{id}/atcs` | UI reads directly via Supabase client |
| Test Run entities | DB schema | Not present (no `test_runs` table) | Sprint 2 planned |
| Defect / Bug tracking | DB schema | Not present | Not planned in visible roadmap |
| Reporting / ROI scoring | — | Not present | Not planned in visible roadmap |

---

## 8. QA Relevance

| Feature | Risk Level | Reason |
|---|---|---|
| Magic-link auth flow | HIGH | Passwordless; no direct token interception in browser tests. Hybrid cookie→PAT bridge is the only headless path. |
| Headless signup/signin PAT mint | HIGH | Core automation bootstrap. Token displayed once; loss requires re-provisioning. PAT scopes gate all subsequent API calls. |
| Module soft-delete cascade | HIGH | Single DELETE call archives module + subtree + user_stories + ACs + ATCs in one RPC. Data loss if wrong ID. |
| User story status gate (`ready_to_test`) | HIGH | Serialized lock + AC count — race condition risk. The only row-lock in the system. |
| AC position reordering | HIGH | `bunkai_move_acceptance_criterion` shifts sibling positions atomically. Concurrent edits may collide. |
| Jira import idempotency | HIGH | Re-runs must not duplicate stories or ACs. External_id uniqueness + partial index. Import serialization (one active job per project). |
| Module move (reparent) | HIGH | `bunkai_move_module` RPC rebuilds materialized path for entire subtree. Cycle detection, depth check, cross-project guard all enforced server-side. |
| Invite token lifecycle | HIGH | Raw token returned once. Resend rotates hash. Email match enforced at accept. Expired/revoked states must be tested. |
| PAT revocation | MEDIUM | Soft-revoke only; revoked tokens must be rejected on all Bearer routes. |
| Workspace slug reservation | MEDIUM | 17 reserved slugs. Creating workspace with reserved slug must return 409. |
| Jira key immutability | MEDIUM | Once `external_id` set on a story, PATCH with different value must return 409. |
| ATC save RPC (bunkai_save_atc) | MEDIUM | Replaces steps + assertions + AC bindings atomically. Empty AC binding list blocked by server action. |
| Auth open-redirect guard | MEDIUM | `next` param validated in magic-link (must be root-relative, no `//`). |
| Markdown sanitization | MEDIUM | `sanitizeMarkdown` called before every DB write for descriptions + details. Raw HTML / unsafe link schemes stripped. |
| Description byte limits | MEDIUM | Module description 500 chars. User story / AC description 50 KB. Project description 5 KB. |
| Active workspace cookie | LOW | `bk_active_ws` httpOnly cookie. Must be workspace the caller belongs to; non-member returns 403. |
| Health endpoint | LOW | `GET /api/v1/health` — no auth. Liveness probe. |
| OpenAPI spec | LOW | Served at `/api/openapi` — no auth. Scalar docs at `/api/docs`. |
| Workspace renaming | LOW | PATCH only updates `name`, not `slug`. Slug is immutable post-creation. |

---

## 9. Discovery Gaps

| Gap | Evidence | Impact |
|---|---|---|
| No `GET /api/v1/projects/{id}` endpoint | Directory has only `modules` under `[id]`; no route.ts at project level | Clients cannot fetch a project by ID via REST. UI reads directly from Supabase client. |
| No `PATCH` or `DELETE` for projects | No route files found | Cannot rename or archive a project via API. |
| No ATC list REST endpoint | No `GET /api/v1/projects/{id}/atcs` or `GET /api/v1/atcs` | Automated tests cannot list ATCs without direct DB access or UI scraping. |
| No standalone ATC create REST endpoint | ATCs created only via `bunkai_save_atc` server action from the UI | No headless API path to create ATCs programmatically (gap for automation workflows). |
| No workspace delete | No DELETE route for workspaces | Cannot clean up workspaces in automated test teardown via API. |
| Module list endpoint | No `GET /api/v1/projects/{id}/modules`; modules loaded in project page via direct Supabase query | Automated test cannot enumerate modules via REST. |
| ATC `archived_at` soft-delete mechanism | `archived_at IS NULL` filters used everywhere, but there is no standalone `DELETE /api/v1/atcs/{id}` route | No headless way to soft-delete a single ATC without triggering a cascade. |
| Invite email delivery | Code logs accept_url to server console (`console.log`) | No transactional email configured; testers must retrieve URL from server logs in non-prod environments. |
| `magic_link_token_secrets.ip_hash` column | Seen in magic-link route but `ip_hash` field not in migration file confirmed | Possible unmigrated column or handled elsewhere; DB schema may differ from route expectations. |
| `next` param in `POST /api/v1/me/active-workspace` | `qa-config.ts` lists this endpoint with method `PUT` but implementation is `POST` | Documentation inconsistency; automated tests should use POST. |
| Test Run entities | No `test_runs`, `run_results`, or related tables in 20 migrations | Sprint 2 feature not started; scope/schema unknown. |
| User listing for workspace | `listMembers` function in invites route returns `user_id` only — no display name or email | Members page cannot show email/name without a separate auth user lookup. |
| ATC search UI | GIN index + TSV column exist in DB; no search input in project UI | Full-text search infrastructure ready but feature not surfaced. |

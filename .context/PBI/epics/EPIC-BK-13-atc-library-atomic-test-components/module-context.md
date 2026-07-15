# ATC Library (Atomic Test Components) - Module Context

**Last Updated:** 2026-06-22
**Stories Tested:** 0

---

## Overview

**Description:** The reusable testing primitives layer of Bunkai TMS. An ATC (Atomic Test Component) is a small, named, reusable test fragment anchored to a User Story + at least one Acceptance Criterion. ATCs hold ordered Steps and ordered Assertions. Tests (a separate epic, EPIC-BK-24) compose multiple ATCs into chains — editing an ATC propagates to every Test that references it (one-edit-many-tests).

**Business Domain:** Test Management / QA Authoring

**Primary Actors:** Senior QA Engineer (author), QA Automation Engineer (consumes ATCs in chains), Product Owner (read-only, reviews "used in N tests" reports)

---

## Routes (Frontend)

| Route | Path | Description |
|-------|------|-------------|
| ATC editor | `app/(app)/projects/[projectSlug]/atcs/[atcId]/page.tsx` | Detail/edit page for a single ATC — title, layer, tags, steps, assertions, AC bindings |
| Project page (ATC table) | `app/(app)/projects/[projectSlug]/page.tsx` | Lists all active ATCs in the project (`AtcTable` component); "New ATC" / "New Test" buttons present but disabled ("ships next sprint") |

No standalone "duplicate" route exists yet — confirmed absent as of this session (see Notes).

---

## State Management (Frontend)

| State File | Path | Purpose |
|------------|------|---------|
| AtcEditor component state | `components/atcs/AtcEditor.tsx` | Holds title/layer/tags/story-binding form state for the editor |
| StepEditor (Monaco) | `components/atcs/StepEditor.tsx` | Lazy-loaded Monaco editor for Markdown step authoring |
| AnchoringPanel | `components/atcs/AnchoringPanel.tsx` | AC picker / binding state for the ATC |

---

## API Endpoints

| Endpoint | Method | Controller/Handler | Purpose |
|----------|--------|-------------------|---------|
| (none — no REST route) | — | `app/(app)/projects/[projectSlug]/atcs/[atcId]/actions.ts` → `saveAtcAction()` | Server Action (not a REST endpoint) that calls the `bunkai_save_atc` Supabase RPC to create or fully replace an ATC's title/layer/tags/steps/assertions/AC-bindings |

**Confirmed gap (this session):** `app/api/v1/atcs/` does not exist in the backend repo at all — there is no `GET/POST /api/v1/atcs` and no `POST /atcs/{id}/duplicate` route. ATC creation/update only happens through the `saveAtcAction` Server Action from the UI. This matches the documented gap in `.context/business/business-api-map.md` §7 ("No standalone ATC create REST endpoint").

---

## Database Tables

| Table | Primary Use | Key Columns |
|-------|-------------|--------------|
| `atcs` | One row per Atomic Test Component | `id`, `module_id`, `user_story_id`, `title`, `layer` (UI/API/Unit), `tags text[]`, `version`, `slug`, `archived_at` |
| `atc_steps` | Ordered steps belonging to an ATC | `id`, `atc_id`, `position`, `content`, `input_data`, `expected` |
| `atc_assertions` | Ordered assertions belonging to an ATC | `id`, `atc_id`, `position`, `content` (YAML) |
| `atc_acceptance_criteria` | M:N binding ATC ↔ Acceptance Criterion | `atc_id`, `acceptance_criterion_id` |

Migrations: `0004_atcs.sql` (schema), `0007_save_atc.sql` (the `bunkai_save_atc` RPC). No migration newer than `0017` touches ATCs — confirms no duplicate/clone DB function exists yet.

---

## Business Rules

| Rule | Description | Source |
|------|-------------|--------|
| ATC anchoring | ATC MUST be anchored to one `user_story_id` AND have ≥1 `acceptance_criterion_id` | epic.md (BK-13) |
| Same-US AC binding | All bound `acceptance_criterion_id`s MUST belong to the same `user_story_id` | epic.md (BK-13) |
| Module subtree constraint | `module_id` of an ATC MUST be the US's module OR a descendant module of the same Project | epic.md (BK-13) |
| Layer enum | `layer` ∈ `{UI, API, Unit}` — strict enum | epic.md (BK-13) |
| Position ordering | Step `position` strictly increasing from 1; assertion `position` same rule | epic.md (BK-13) |
| Edit versioning | ATC edit increments `version` integer; Tests referencing it auto-reflect changes (no copy-on-write) | epic.md (BK-13) |
| Slug stability | ATC slug format `{module-slug}/{atc-id-padded}` — stable across renames | epic.md (BK-13) |
| Duplicate title default | Duplicate creates new ATC row with title suffix `(copy)` unless override provided | epic.md (BK-13), BK-23 scope |

---

## Key Entities for Testing

| Entity Type | Name | ID | Use Case |
|-------------|------|-----|----------|
| ATC (example from ACs) | "Login happy path" | TBD — discover via `[DB_TOOL]` or UI | Source ATC with 3 steps + 2 assertions, used as the duplication source in BK-23 ACs |

No concrete seeded ATC ID has been discovered yet — to be filled during Stage 1 test-data discovery for whichever story executes first against this module.

---

## Common Test Scenarios

| Scenario | Preconditions | Steps | Expected |
|----------|---------------|-------|----------|
| Duplicate with steps + assertions | Source ATC exists with N steps + M assertions | Trigger duplicate action | New ATC row with same N steps + M assertions, independent rows |
| Default copy title | Source ATC titled "X" | Duplicate without custom title | New ATC titled "X (copy)" |
| Custom copy title | Source ATC titled "X" | Duplicate with custom title "Y" | New ATC titled "Y" |
| Copy independence | Duplicate exists | Edit a step in the copy | Source ATC's steps unchanged |

(Scenarios sourced from BK-23 ACs — see story-level `acceptance-criteria.md` for the authoritative, Jira-synced text.)

---

## Stories in This Module

| Story | Title | Status | Link |
|-------|-------|--------|------|
| BK-18 | TMS-ATC API \| Create and edit ATCs with steps and assertions | QA Approved | [context](./stories/STORY-BK-18-tms-atc-api-create-and-edit-atcs-with-steps-and-assertions/context.md) (not yet created this session) |
| BK-19 | TMS-ATC Builder \| Build an ATC with ordered steps and assertions | Ready For QA | (not yet created this session) |
| BK-20 | TMS-ATC Search \| Search and autocomplete ATCs | Ready For Dev | (not yet created this session) |
| BK-21 | TMS-ATC Propagation \| Cascade ATC edits to all tests | Shift-Left QA | (not yet created this session) |
| BK-22 | TMS-ATC Usage \| See a "Used in N tests" report | Ready For Dev | (not yet created this session) |
| BK-23 | TMS-ATC Duplicate \| Duplicate an ATC with steps and assertions | Ready For QA | [context](./stories/STORY-BK-23-tms-atc-duplicate-duplicate-an-atc-with-steps-and-/context.md) |

(Statuses above are as last read from `epic.md` / this session's BK-23 sync; other stories' statuses are not re-verified this session.)

---

## Notes

- **Critical discrepancy found this session (2026-06-22):** BK-23's Jira status is "Ready For QA" and two "Automation for Jira" bot comments (2026-06-20) claim a Pull Request was created and merged. However, exploring the backend repo (`upex-bunkai-tms`) found **no duplicate/clone implementation anywhere**: no `app/api/v1/atcs/` route directory exists at all (no REST surface for ATCs of any kind, only the `saveAtcAction` Server Action that creates/updates via `bunkai_save_atc`), no migration after `0017` touches the `atcs` table, and no duplicate-related SQL function exists. The PR referenced by the bot comments could have merged code that lives outside what was explored (e.g. a feature branch not yet on the inspected `main`, or the merge target differs from the checked worktree) — this needs verification before testing starts, not assumed as a blocker.
- ATC creation/update has no dedicated "Create" button live yet — the UI's "New ATC" button is disabled ("ATC builder ships next sprint"). ATCs today are only created via direct calls to `saveAtcAction` (i.e., editing an existing ATC row that must already exist by some other path, likely DB seed or the BK-18 API once it ships).
- BK-23 explicitly depends on BK-18 (TMS-ATC API) landing first per the architect annotation comment — BK-18 is now "QA Approved" per the freshly synced traceability section in `story.md`, so the upstream dependency is satisfied on the Jira side.
- The Shift-Left QA refinement (comments from Ely and Ramiro Majdalani, 2026-06-02) raised significant unresolved questions: role gate (which workspace roles can duplicate), title-overflow handling (truncate vs reject at 200 chars), API path/body/response shape mismatches between the OpenAPI spec and the architect's technical notes, duplicate-title collision behavior, and archived-source-ATC behavior. These are NOT yet reflected in the original 4 ACs (which only cover happy path + independence). Stage 1 planning for this story should treat the refined Gherkin scenarios from Ramiro's comment as the working test basis, not just the original 4 ACs, but the open PO/Dev questions (Q1, Q2, and gaps G1-G3, G5) remain unconfirmed as of this sync.

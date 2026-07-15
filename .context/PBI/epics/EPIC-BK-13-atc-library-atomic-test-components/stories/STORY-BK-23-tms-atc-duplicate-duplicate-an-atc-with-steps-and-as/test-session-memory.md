# Test Session Memory — BK-23

> Shared payload across the 4 sub-agent dispatches. Updated after each stage.

## Identity

| Field | Value |
|---|---|
| Ticket | BK-23 |
| Summary | TMS-ATC Duplicate \| Duplicate an ATC with steps and assertions |
| Epic | BK-13 — ATC Library (Atomic Test Components) |
| Status at session start | Ready For QA |
| Priority | Medium |
| Assignee | Benjamin Segovia |

## Environment

| Field | Value |
|---|---|
| Active env | staging |
| WEB_URL | https://staging-upexbunkai.vercel.app |
| API_URL | https://staging-upexbunkai.vercel.app/api |
| Env reachability | GREEN (307 redirect — staging UP) |
| WEB_URL_OVERRIDE | — |

## TMS Modality

- **Modality:** jira-native (no Xray)
- ATP field: `customfield_10067` (🧪 Acceptance Test Plan)
- ATR field: `customfield_10147` (🧪 Acceptance Test Results)
- TC work items: created in Stage 4 only (regression-worthy); Stage 1 produces outlines only

## Shift-Left Status

- Reviewed: YES (2026-06-02, 24 days ago — within 30-day window)
- Label: shift-left-reviewed
- Stage 1 short-circuits Phases 1-3 of acceptance-test-planning.md → continues from Phase 4

## Acceptance Criteria Summary

| AC# | Scenario | Risk |
|---|---|---|
| AC1 | Duplicate copies all steps + assertions | HIGH — core happy path |
| AC2 | Default title = source + "(copy)" | MEDIUM — UX contract |
| AC3 | Custom title override | MEDIUM — input validation boundary |
| AC4 | Copy independence (edit copy ≠ change original) | HIGH — data integrity |

## API Surface

- Endpoint: `POST /atcs/{source_id}/duplicate`
- Body: `{ new_title?: string }` (optional)
- Responses: 201 / 403 / 404 / 422
- DB tables: atcs, atc_steps, atc_assertions (transactional)

## Stage Progress

| Stage | Status | Timestamp |
|---|---|---|
| Session Start | completed | 2026-06-26 |
| Stage 1 — Planning | completed | 2026-06-26 |
| Stage 2 — Execution | completed | 2026-06-28 |
| Stage 3 — Reporting | pending | — |

## Bugs Found

| Bug ID | Severity | Summary | Surface |
|---|---|---|---|
| BUG-1 | MEDIUM | API field name mismatch: spec says `new_title`, implementation accepts `title`; `new_title` silently ignored | API |
| BUG-2 | MAJOR | No UI Duplicate action exists — endpoint works but feature has no UI entry point | UI |

## Open Questions

- TC02/TC03: Can 0-step / 0-assertion ATCs be created? UI enforces at least 1 step; API validation unknown. TCs BLOCKED pending clarification.

---

## Stage 2 — Execution

**Date:** 2026-06-28
**Environment:** staging (`https://staging-upexbunkai.vercel.app`)
**Auth method:** Magic link OTP — password `123578` is 6 chars, below 8-char minimum; used `POST /api/v1/auth/magic-link` instead, OTP retrieved from Resend inbound inbox
**DB leg:** BLOCKED — `staging-dhhub` MCP not configured (`DBHUB_TYPE/DBHUB_HOST/etc.` all empty in `.env`). Data integrity verified through API responses and UI navigation.

---

### Smoke — PASSED

| Check | Result |
|---|---|
| Staging reachable | PASSED — 307 redirect to login page |
| Login (magic link OTP) | PASSED — redirected to `/onboarding` after OTP entered |
| Project + ATC navigation | PASSED — ATC explorer loaded at `/projects/bk-23-test-project/atcs/` |
| Test data created | PASSED — workspace > project > module > user story > AC > ATC built via API |
| Evidence | `BK-23-smoke-staging-login-page.png`, `BK-23-smoke-project-atc-view.png` |

---

### UI Exploration

| Check | Result | Notes |
|---|---|---|
| Duplicate button in ATC detail view | NOT FOUND | No button, link, context-menu or tooltip with duplicate/clone/copy action |
| Duplicate action in ATC explorer list | NOT FOUND | `querySelectorAll('button, [role="button"], [aria-label]')` returned no duplicate action |
| ATC list shows "(copy)" titles | PASSED | Two ATCs titled "Login happy path (copy)" visible — evidence: `BK-23-ac2-default-title.png` |

---

### API Triforce

| TC# | AC | Scenario | Result | Notes |
|---|---|---|---|---|
| TC01 | AC1 | Happy path — POST no body → 201, steps + assertions copied | PASSED | `201`, 3 steps + 3 assertions in copy response |
| TC02 | AC1 | 0-step ATC → duplicate has 0 steps | BLOCKED | UI enforces >=1 step; 0-step source cannot be created without dedicated setup |
| TC03 | AC1 | 0-assertion ATC → duplicate has 0 assertions | BLOCKED | Same constraint as TC02 |
| TC04 | AC1 | Step content preserved (same text, new IDs) | PASSED | Step 1 "Open the login page" copied verbatim; step ID differs from source |
| TC05 | AC1 | Assertion content preserved (same text, new IDs) | PASSED | "page redirects to /dashboard" copied; assertion ID differs |
| TC06 | AC2 | Source title 198 chars → default "(copy)" suffix = 204 chars → 422 | PASSED | `422 validation_failed` returned correctly |
| TC07 | AC2 | No body → default title = source + " (copy)" | PASSED | `"Login happy path (copy)"` returned |
| TC08 | AC2 | Empty body `{}` → default title applied | PASSED | Same result as TC07 |
| TC09 | AC2 | Slug on copy is fresh (not cloned from source) | PASSED | Source `atc-802a9525`, copy `atc-4124e152` |
| TC10 | AC3 | Custom title via `title` field → accepted | PASSED | `{"title":"My custom copy via title field"}` → 201, correct title |
| TC11 | AC3 | Custom title via `new_title` field (per spec) → accepted | FAILED | `{"new_title":"Custom Title"}` → 201 but title = default; `new_title` silently ignored → **BUG-1** |
| TC12 | AC3 | Title 3 chars (min boundary) | PASSED | `"ABC"` → 201 |
| TC13 | AC3 | Title 2 chars (below min) | PASSED | `"AB"` → 422 `validation_failed` |
| TC14 | AC3 | Title 200 chars (max boundary) | PASSED | T*200 → 201, title length = 200 |
| TC15 | AC3 | Title 201 chars (above max) | PASSED | T*201 → 422 `validation_failed` |
| TC16 | Error | No auth header → 401 | PASSED | `401 unauthorized` |
| TC17 | Error | Non-existent source_id → 404 | PASSED | `404 not_found` |
| TC18 | AC4 | Edit copy step → source step unchanged | PASSED | PATCH copy step 1 → source step 1 still "Open the login page" — evidence: `BK-23-ac4-original-unchanged.png` |

---

### DB Leg

**Status: BLOCKED**

MCP `staging-dhhub` has no credentials — `.env` fields `DBHUB_TYPE`, `DBHUB_HOST`, `DBHUB_PORT`, `DBHUB_DATABASE`, `DBHUB_USER`, `DBHUB_PASSWORD` are all empty. DB INSERT verification performed indirectly via API response payloads and UI navigation.

---

### Bugs Surfaced

**BUG-1 — MEDIUM — API field name mismatch**
- Spec (FR-014): body field is `new_title`
- Implementation: body field `title` is accepted; `new_title` is silently ignored, falls back to default title
- Repro: `POST /api/v1/atcs/{id}/duplicate` `{"new_title":"Custom Title"}` → 201 with title `"Login happy path (copy)"`
- Fix: update API handler to read `new_title`, or update spec to document `title` as the accepted field
- Impact: clients following the architect spec get the default title silently — no error, no signal

**BUG-2 — MAJOR — No UI Duplicate action**
- Story requires "duplicate an ATC in one click"
- Finding: no Duplicate button, icon, context-menu entry, or any UI affordance in ATC detail or explorer
- API endpoint `POST /api/v1/atcs/{id}/duplicate` is fully implemented and functional
- The UI layer that calls this endpoint is not implemented
- DoD item "Feature works end-to-end against staging" is NOT met

---

### Stage 2 Verdict

**FAIL**

- 14 / 16 testable TCs: PASSED
- 1 / 16: FAILED (TC11 — BUG-1)
- 2 / 18: BLOCKED (TC02, TC03 — 0-step/0-assertion test data not available)
- BUG-2 (MAJOR) blocks user-facing DoD independently of TC results

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
| Stage 2 — Retest | completed | 2026-08-07 |
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

---

## Stage 2 — Retest (2026-08-07)

**Trigger:** BK-184, BK-185, BK-175 all confirmed Cerrada (verified via `acli jira workitem view` before starting — all three read `status.name: "Cerrada"`). BK-23 itself still `BLOCKED` at dispatch start.

**Auth:** magic-link OTP via `bunkai-staging-userbunk@olkacoraug.resend.app` — confirmed working end-to-end (BK-175 fix verified live: email was a real clickable "Your sign-in link", not a signup code). Resend inbound inbox read via `resend emails receiving list/get`.

**Tool gap found:** `bun run api:login staging` fails 401 against the real staging test account. Root cause: `config/variables.ts` `envDataMap.staging` hardcodes `https://dojo.upexgalaxy.com`, which is a DIFFERENT deployment than `.agents/project.yaml`'s `environments.staging.web_url` (`https://staging-upexbunkai.vercel.app`) — the one this whole QA session is scoped to and the one BK-175/BK-184/BK-185 were verified against. Worked around by extracting the authenticated session's Supabase JWT was tried first (rejected — `lib/api/middleware/bearer.ts` only accepts `bk_pat_*` PATs, not raw Supabase JWTs) then abandoned in favor of running authenticated `fetch()` calls from inside the logged-in browser session via `playwright-cli eval` (cookie auth, which the OpenAPI spec documents as accepted: `security: [{cookieAuth:[]},{bearerAuth:[]}]`, confirmed in `lib/api/principal.ts resolveIdentity()`). Non-blocking, but flag for whoever owns `config/variables.ts` — the two config sources have drifted and any future `api:login`-based session will silently target the wrong host.

### TC11 retest — FAILED (regression, not the expected fix)

Per the code (`app/api/v1/atcs/[id]/duplicate/route.ts`, `lib/atcs/validation.ts` — unchanged since the single `80a4fe6` commit) the accepted field is `title`. BK-184 was closed with root cause "Requirement Error" (spec corrected to match code, no code change). Retest sent all three probes against source ATC `9bb34acc-8d27-49d0-a2d8-227a4c77500c`:

| Probe | Sent | Applied title | Verdict |
|---|---|---|---|
| `{"title":"ZZZZ-DISTINCT-TITLE-CHECK-ZZZZ"}` | `title` only | `"Login happy path (copy)"` (default — ignored) | title field silently ignored |
| `{"new_title":"YYYY-NEWTITLE-FIELD-CHECK-YYYY"}` | `new_title` only | `"YYYY-NEWTITLE-FIELD-CHECK-YYYY"` | new_title field applied |
| `{"title":"AAAA","new_title":"BBBB"}` | both | `"BBBB"` | new_title wins over title |

**Finding:** live staging (`staging-upexbunkai.vercel.app`) currently honours `new_title` and silently ignores `title` — the ORIGINAL pre-BK-184 bug behavior, and the exact opposite of what the checked-out backend repo source reads. This is either an undeployed-fix / stale-deployment gap, or BK-184's "Requirement Error" closure does not reflect current live behavior. TC11 (which retests the `title` field per BK-184's resolution) is scored FAILED per the dispatch's own rule ("FAIL if... the field name changed to something else undocumented"). TC10 would also now FAIL if re-run (regression from the 2026-06-28 PASS).

### TC10/TC07/TC08 regression

| TC | Check | Result |
|---|---|---|
| TC07 | POST no body → default title | PASSED — `"Login happy path (copy)"` |
| TC08 | POST empty body `{}` → default title | PASSED — `"Login happy path (copy)"` |
| TC10 | `title` field custom title | **REGRESSED to FAIL** — see TC11 table above (same probe) |

### UI Duplicate retest (BK-185) — PASSED, both entry points

| Entry point | Result | Evidence |
|---|---|---|
| ATC detail-view toolbar "Duplicate" button | 201, redirected to `/atcs/{new_id}`, title + 3 steps + 3 assertions rendered correctly, 0 console errors | `evidence/BK-23-retest-ui-duplicate-detail-button.png` |
| ATC explorer right-click context menu → "Duplicate ⌘D" | 201, redirected to `/atcs/{new_id}`, same content verified | `evidence/BK-23-retest-ui-duplicate-context-menu.png`, `evidence/BK-23-retest-ui-duplicate-explorer-result.png` |

Both call `POST /atcs/{id}/duplicate` with body `{}` (no custom-title UI affordance in either entry point — duplicate-then-rename is the only UI path for a custom title, confirmed by reading `project-explorer.tsx handleDuplicateAtc`).

### TC02 — DESCOPED (not a defect)

Probed `POST /api/v1/atcs` with `steps: []` → `422 validation_failed` (`steps: too_small, minimum 1`). Confirmed in `lib/atcs/validation.ts`: `steps: z.array(AtcStepInputSchema).min(1)`. A 0-step ATC cannot exist in this system at the API layer OR the UI layer — creation is structurally blocked before duplication is ever reachable. TC02 tests a state the system cannot produce; descoped as not-applicable rather than left BLOCKED indefinitely.

### TC03 — PASSED (previously BLOCKED, now executable)

Assertions ARE optional at creation (`assertions: z.array(...).optional().default([])`), so a 0-assertion ATC is reachable. Created source `593f035f-2fe7-49e9-bc9b-6d084cd3a26c` (1 step, 0 assertions) → duplicated → copy `f2db6645-799e-4c42-aea7-f56db9281b2a`: 201, 1 step copied verbatim, `assertions: []`, no crash, default title `"Zero-assertion source for TC03 (copy)"` applied. Evidence: `evidence/BK-23-retest-tc03-zero-assertion-copy.png`.

### AC1 / AC4 regression sanity (light pass)

| Check | Method | Result |
|---|---|---|
| AC1 — steps + assertions copied | Fresh POST duplicate (no body) on source `9bb34acc-...` | PASSED — 3 steps + 3 assertions copied to new id `a944b13c-...` |
| AC4 — copy independence | PATCH copy `a944b13c-...` step 1 → `"Open the login page [EDITED-COPY-ONLY]"` (full-replace body), then loaded source `9bb34acc-...` | PASSED — source step 1 still reads `"Open the login page"`, unaffected. Evidence: `evidence/BK-23-retest-ac4-source-unchanged.png` |
| TC17 — non-existent source → 404 | `POST /atcs/00000000-.../duplicate` | PASSED — 404 |

### DB leg — still BLOCKED (carried forward, unchanged)

`DBHUB_TYPE/HOST/PORT/DATABASE/USER/PASSWORD` all still empty in `.env`. Same gap as 2026-06-28. Not attempted this pass per dispatch instruction. Copy-independence (AC4) verified only via API/UI observation, not at the SQL/row level.

### Stage 2 Retest Verdict

**FAIL — BK-23 remains blocked**, but for a DIFFERENT reason than the original pass:

- BK-185 (no UI Duplicate action): **CONFIRMED FIXED** — both entry points work end-to-end.
- BK-184 (title field): **REGRESSED / NOT FIXED ON THIS ENVIRONMENT** — `title` field silently ignored again; `new_title` (the originally-reported-wrong field) is now the one that works. TC11 FAILS.
- TC02: DESCOPED (structurally not-applicable, documented above).
- TC03: PASSED (no longer blocked).
- AC1/AC4/TC17 regression: all PASSED, no collateral damage from BK-185's fix.
- DB leg: carried forward BLOCKED, unchanged.
- Tooling: `bun run api:login staging` targets a stale/wrong host (`dojo.upexgalaxy.com` vs `.agents/project.yaml`'s `staging-upexbunkai.vercel.app`) — non-blocking but flagged.

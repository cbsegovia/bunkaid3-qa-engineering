# Shift-Left Refinement: BK-23 — TMS-ATC Duplicate

**Status**: Refined — Awaiting PO Estimation
**Mode**: Shift-Left (pre-sprint, single-story refinement)
**Refined on**: 2026-06-02
**Refined by**: QA — Shift-Left session
**Modality**: Jira-native
**Source spec**: FR-014
**Upstream dependency**: BK-18 (FR-010a) — must land first

---

## Phase 1 — Critical Analysis

### Business context

- **Primary persona affected**: Senior QA Engineer (Elena) who manages ATCs in Bunkai TMS.
- **Secondary personas**: QA Automation Engineer (relies on duplicated ATCs as templates for test-chain variants). Product Owner (benefits from faster ATC authoring, reducing sprint cycle time).
- **Business value proposition**: Eliminate the friction of manually recreating a known-good ATC from scratch when a variant is needed. Reduces authoring time and copy-paste errors in the test repository.
- **KPI(s) influenced**: ATC authoring velocity; reduction in test-duplication defects; sprint throughput for QA automation tasks.
- **User journey position**: Post-ATC authoring. Elena has an existing, validated ATC and wants a variant (e.g., "Login with remember-me" derived from "Login happy path"). This is an authoring-layer action, not a test-execution action.

### Technical context

- **Frontend**: ATC detail page / ATC list view — a "Duplicate" action (button or context-menu item) triggers the duplicate flow. Optionally a modal or inline input allows setting a custom title. On success, the UI redirects to the new ATC detail page.
- **Backend**: Single endpoint `POST /atcs/{source_id}/duplicate` with optional body `{ new_title: string }`. Implemented as one DB transaction across three tables (`atcs`, `atc_steps`, `atc_assertions`). Relies on `createAtc()` service function and slug-computation logic from **BK-18 (FR-010a)**.
- **External services**: None.
- **Integration points specific to this Story**:
  - `atcs` INSERT inherits `module_id`, `user_story_id`, `acceptance_criterion_ids`, `layer`, `tags` from source; sets `version = 1`, generates fresh `slug`.
  - `atc_steps` bulk INSERT copies `position`, `content`, `input_data`, `expected` from source rows, preserving order.
  - `atc_assertions` bulk INSERT copies `position`, `content` from source rows, preserving order.
  - Event `atc.created` emitted — standard downstream pipeline, no special consumer needed.
  - RLS policies on `atcs` enforce workspace-boundary reads and writes (from `business-data-map.md` §DB Triggers & RLS Helpers).

### Story complexity

| Axis | Rating | Why |
|------|--------|-----|
| Business logic | Medium | Title defaulting, title validation (3..200 chars), workspace scoping, independence constraint |
| Integration | Medium | Three-table transactional write; upstream BK-18 dependency; event emission |
| Data validation | Medium | Title length 3..200; title uniqueness (unclear — see Gap G2); source existence (404 guard); workspace boundary (403 guard) |
| UI | Low | Single action trigger + optional title input + redirect on success; no complex rendering |

**Estimated test effort**: Medium — ~3–4 story points for QA. The transaction and independence invariant require specific test scenarios. Outline count is moderate (see Phase 4).

### Epic-level inheritance

- No feature-test-plan.md found for the parent epic (file not present).
- From `master-test-plan.md`: **ATC Authoring & Cascades** is rated HIGH priority. The master plan notes that cascading updates to reusable components must propagate safely. Duplicate is an authoring action — independence of the copy is the primary risk surface.
- From `business-data-map.md`: RLS policies are workspace-scoped on `atcs`. Any cross-workspace access attempt must be blocked at the DB layer (404 on lookup → 403 on insufficient role).

---

## Phase 2 — Story Quality Analysis

### Ambiguities

| # | Location in Story | Question for PO/Dev | Impact on testing | Suggested clarification |
|---|-------------------|---------------------|-------------------|------------------------|
| AMB-1 | Workflow step 2 — "optionally typing a new title" | Is the title input presented as a modal dialog, an inline field on the card, or a separate form step? | QA cannot design UI interaction steps without knowing the affordance | Specify the UI component: modal with title field + Confirm/Cancel OR single-click with immediate creation and inline rename |
| AMB-2 | AC1 — "When I duplicate it" | What is the exact UI trigger — button label, tooltip text, keyboard shortcut, right-click context menu? | Test steps must reference the precise interaction element | Specify label/icon name used in design (e.g., "Duplicate" button, copy icon) |
| AMB-3 | AC3 — "type the title" | Is the custom title field validated on keystroke (live) or on submit? Is there a character counter shown? | Boundary testing of 3..200 chars requires knowing the validation UX | Clarify: server-side 422 only, or client-side pre-validation too |
| AMB-4 | Business Rule "Provenance" — "keeps the same User Story and Acceptance Criteria anchors as the source" | If the source ATC has multiple `acceptance_criterion_ids`, are ALL of them copied verbatim, or only the primary one? | Need exact assertion against the copy's `acceptance_criterion_ids` array | Confirm: bulk copy all `acceptance_criterion_ids` from source row |

### Gaps (missing info)

| # | Type | Why critical | What to add | Risk if omitted |
|---|------|--------------|-------------|-----------------|
| G1 | AC — missing error scenarios | The 4 Gherkin scenarios cover only the happy path and independence. No AC covers 404, 403, or 422 responses. | Add Negative ACs: (a) duplicate from another workspace → 404/403; (b) title too short (<3 chars) → 422; (c) title too long (>200 chars) → 422 | QA has no spec to assert error shape; Dev ships without a test contract for error paths |
| G2 | Business rule — title uniqueness | The architect annotation does not mention a uniqueness constraint on ATC titles within a module. Is there one? | Add a rule: "Title must be unique within the owning module" OR "Title uniqueness is not enforced — duplicates allowed" | If uniqueness IS enforced, a title clash scenario is missing; if NOT enforced, the default "(copy)" suffix may collide silently |
| G3 | AC — source ATC edge states | No AC covers duplicating a soft-deleted or archived ATC. Bunkai uses soft-delete patterns (inferred from `business-data-map.md` entity model). | Add AC: "Attempting to duplicate an archived/deleted ATC returns 404" | Dev may implement without guarding against this; users might trigger the flow via stale URL |
| G4 | AC — empty steps / assertions | No AC covers duplicating an ATC that has 0 steps or 0 assertions (a newly created, skeleton ATC). | Add AC: "Duplicate an ATC with no steps produces a copy with no steps" | Bulk INSERT of 0 rows is a valid DB path but may hit an edge in ORM query handling |
| G5 | Technical — slug collision | Architect says slug is "freshly computed from new atc_id". If slug generation has any collision window (race condition on concurrent duplicates), the INSERT may fail. | Clarify slug generation: is it derived deterministically from `atc_id` (UUID-based, collision-free) or from title (needs uniqueness check)? | Silent 500 on concurrent duplicate-clicks; no graceful error surfaced to user |
| G6 | AC — idempotency / double-click | No AC covers double-clicking the Duplicate button before the first response arrives. | Add AC or business rule: "Duplicate triggered twice before first response creates one or two copies?" | Universal question U5 — duplicate charges / duplicate records. Here: duplicate ATCs |

### Edge cases not in Story

| # | Scenario | Expected behavior (best guess) | Criticality | Action |
|---|----------|-------------------------------|-------------|--------|
| EC-1 | Source ATC title is exactly 197 characters — default "(copy)" suffix would produce a 204-char title exceeding the 200-char limit | API computes the default title, detects it exceeds 200 chars, truncates source title to 194 chars before appending " (copy)" — OR returns 422 asking user to provide a shorter title | High | Add to AC — **NEEDS PO/DEV CONFIRMATION** |
| EC-2 | Source ATC has been soft-deleted (archived) but its `atc_id` is still known via URL | API returns 404 (same as cross-workspace) to avoid revealing archived status | Medium | Add to AC — **NEEDS PO/DEV CONFIRMATION** |
| EC-3 | Duplicate triggered by two simultaneous requests (double-click, concurrent sessions) | Transaction isolation prevents double-insert; second transaction sees committed slug and succeeds independently (two copies created) OR is rejected by a uniqueness constraint | Medium | Technical question for Dev — **NEEDS PO/DEV CONFIRMATION** |
| EC-4 | Source ATC has 0 steps and 0 assertions | Duplicate succeeds; new ATC has 0 steps, 0 assertions; no error raised | Medium | Add to AC — **NEEDS PO/DEV CONFIRMATION** |
| EC-5 | `new_title` body field is present but is an empty string `""` | Server treats empty string as "no title provided" and applies default — OR returns 422 "title too short (min 3)" | Medium | Technical question for Dev — **NEEDS PO/DEV CONFIRMATION** |
| EC-6 | Source ATC belongs to a module that the requesting user can read but not write (read-only role) | 403 — same gate as workspace boundary check | High | Add to AC — **NEEDS PO/DEV CONFIRMATION** |
| EC-7 | Source ATC's `acceptance_criterion_ids` references an AC that has since been deleted | Copy inherits the orphaned IDs verbatim — FK violation if constraint exists, or silent dangling reference if not | Medium | Technical question for Dev — **NEEDS PO/DEV CONFIRMATION** |
| EC-8 | Duplicate action performed by a Workspace Admin on another member's private ATC (if private ATCs are a concept) | Currently Business Rules say "only members of the owning Workspace can duplicate" — no mention of privacy levels | Low | Confirm whether ATC-level visibility/privacy exists in this product |

### Contradictions

No direct contradictions found between description, ACs, and architect annotation. One potential tension:

- The Business Rule says "Only members of the owning Workspace can duplicate" (implies any member can duplicate). The architect note says "403 on insufficient role". These may disagree: does "member" mean ANY workspace member, or only members with a specific role (e.g., Senior QA or above)? This is currently an ambiguity, not a confirmed contradiction — see Critical Question Q1 below.

### Testability validation

**Verdict**: Partial

Issues:
- **Missing exact error messages**: The ACs do not specify the 422 response body shape (field name, message text) or the 404/403 messages. QA cannot write assertions without these.
- **UI component undefined**: Without knowing if the duplicate trigger is a button, modal, or context-menu, UI test steps cannot be written precisely (AMB-1, AMB-2).
- **Title uniqueness undefined**: G2 above. Cannot design negative scenario for title collision without knowing the rule.
- **Empty-string title behavior undefined**: EC-5. API contract gap.

---

## Phase 3 — Refined Acceptance Criteria

### Original AC1 — Duplicate ATC with steps and assertions

#### Scenario 1.1: Should create an independent copy with all steps and assertions when duplicating (Type: Positive, Priority: Critical)

- **Given**: A workspace member "Elena" is logged in. An ATC titled "Login happy path" exists in the same workspace with exactly 3 steps (positions 1, 2, 3) and 2 assertions (positions 1, 2). The ATC is not archived.
- **When**: Elena triggers the Duplicate action on "Login happy path" without providing a custom title.
- **Then**:
  - API: `POST /atcs/{source_id}/duplicate` returns HTTP 201 with body `{ "atc_id": "<new_uuid>" }`.
  - DB (`atcs`): A new row is inserted with `title = "Login happy path (copy)"`, `version = 1`, a freshly generated `slug` (different from source slug), `module_id` identical to source, `layer` identical to source, `tags` identical to source.
  - DB (`atc_steps`): 3 rows inserted for the new `atc_id` with `position` values 1, 2, 3 and `content`, `input_data`, `expected` matching the source rows exactly.
  - DB (`atc_assertions`): 2 rows inserted for the new `atc_id` with `position` values 1, 2 and `content` matching source rows exactly.
  - UI: Redirects to the new ATC detail page showing "Login happy path (copy)" with 3 steps and 2 assertions.

---

### Original AC2 — Default title applies "(copy)" suffix

#### Scenario 2.1: Should default copy title to "{source title} (copy)" when no custom title is provided (Type: Positive, Priority: High)

- **Given**: An ATC titled "Login happy path" exists in the workspace.
- **When**: Elena duplicates it without entering a custom title (the title field is empty or not presented).
- **Then**:
  - The new ATC's title is exactly `"Login happy path (copy)"` — no trailing space, no double suffix.
  - API returns 201 `{ "atc_id": "<new_uuid>" }`.

---

### Original AC3 — Custom title overrides default

#### Scenario 3.1: Should use the provided custom title when one is supplied during duplication (Type: Positive, Priority: High)

- **Given**: An ATC titled "Login happy path" exists in the workspace.
- **When**: Elena duplicates it and enters the title `"Login with remember-me"` in the title field.
- **Then**:
  - The new ATC's title is exactly `"Login with remember-me"`.
  - API returns 201 `{ "atc_id": "<new_uuid>" }`.
  - DB: source ATC row is unchanged (title still "Login happy path").

---

### Original AC4 — Independence: editing the copy does not affect the original

#### Scenario 4.1: Should not modify source ATC steps when a step in the copy is edited (Type: Positive, Priority: Critical)

- **Given**: Elena has duplicated "Login happy path" producing "Login happy path (copy)". Both ATCs have 3 steps with identical `content` values.
- **When**: Elena edits step 1 of "Login happy path (copy)" changing its `content` to `"Open the app in incognito mode"`.
- **Then**:
  - DB (`atc_steps`): The copy's step 1 row reflects the new `content`. The source's step 1 row is unchanged.
  - UI: The original "Login happy path" detail page still shows the original step 1 content.
  - No FK or shared reference links the two ATCs' step rows.

---

### New scenarios surfaced from Phase 2 edge cases — NEEDS PO/DEV CONFIRMATION

#### Scenario E1: Should return 404 when attempting to duplicate an ATC from another workspace (Type: Negative, Priority: Critical)

- **NEEDS PO/DEV CONFIRMATION**: Behavior inferred from architect annotation (404 on cross-workspace lookup). Confirm exact HTTP status used (404 vs 403) and response body shape.
- **Given**: Elena is a member of Workspace A. ATC `{source_id}` belongs to Workspace B.
- **When**: Elena calls `POST /atcs/{source_id}/duplicate`.
- **Then**:
  - API returns HTTP 404 (source not found in caller's workspace scope — avoids workspace existence disclosure).
  - No new rows inserted in `atcs`, `atc_steps`, or `atc_assertions`.
  - DB state: unchanged.

#### Scenario E2: Should return 403 when the requesting user has insufficient role to duplicate (Type: Negative, Priority: Critical)

- **NEEDS PO/DEV CONFIRMATION**: The Business Rule says "members of the owning Workspace can duplicate" but the architect note says "403 on insufficient role". Confirm which workspace roles (if any) are blocked from duplicating.
- **Given**: A user with role below the required threshold is logged in to the owning workspace.
- **When**: The user calls `POST /atcs/{source_id}/duplicate`.
- **Then**:
  - API returns HTTP 403.
  - Response body: `{ "error": "<exact message — confirm with Dev>" }`.
  - No new rows inserted.

#### Scenario E3: Should return 422 when the custom title is fewer than 3 characters (Type: Negative, Priority: High)

- **NEEDS PO/DEV CONFIRMATION**: Title constraint 3..200 from architect annotation — not in original ACs.
- **Given**: Elena triggers duplicate and enters title `"AB"` (2 characters).
- **When**: The form is submitted / API called with `{ "new_title": "AB" }`.
- **Then**:
  - API returns HTTP 422.
  - Response body indicates title validation failure (exact message TBD — confirm with Dev).
  - No new ATC row created.

#### Scenario E4: Should return 422 when the custom title exceeds 200 characters (Type: Boundary, Priority: High)

- **NEEDS PO/DEV CONFIRMATION**: Upper boundary from architect annotation — not in original ACs.
- **Given**: Elena triggers duplicate and enters a title of exactly 201 characters.
- **When**: API called with `{ "new_title": "<201-char string>" }`.
- **Then**:
  - API returns HTTP 422.
  - Response body indicates title length violation.
  - No new ATC row created.

#### Scenario E5: Should duplicate successfully when the custom title is exactly 3 characters (Type: Boundary, Priority: Medium)

- **NEEDS PO/DEV CONFIRMATION**: Lower boundary. Confirm 3-char title is accepted.
- **Given**: Source ATC exists in the workspace.
- **When**: Elena duplicates it with `{ "new_title": "ABC" }`.
- **Then**:
  - API returns HTTP 201 with `{ "atc_id": "<new_uuid>" }`.
  - New ATC created with title `"ABC"`.

#### Scenario E6: Should duplicate successfully when the custom title is exactly 200 characters (Type: Boundary, Priority: Medium)

- **NEEDS PO/DEV CONFIRMATION**: Upper boundary at limit.
- **Given**: Source ATC exists in the workspace.
- **When**: Elena duplicates it with a title of exactly 200 characters.
- **Then**:
  - API returns HTTP 201.
  - New ATC created with the 200-char title intact.

#### Scenario E7: Should produce a copy with 0 steps and 0 assertions when source ATC has none (Type: Edge, Priority: Medium)

- **NEEDS PO/DEV CONFIRMATION**: Source ATC may have 0 steps (newly created skeleton).
- **Given**: An ATC "Empty ATC draft" exists with 0 steps and 0 assertions.
- **When**: Elena duplicates it.
- **Then**:
  - API returns HTTP 201.
  - New ATC row inserted with title `"Empty ATC draft (copy)"`.
  - 0 rows inserted in `atc_steps` and `atc_assertions` for the new ATC.

#### Scenario E8: Should handle default title truncation when source title is near the 200-char limit (Type: Edge, Priority: High)

- **NEEDS PO/DEV CONFIRMATION**: If source title is ≥197 chars, appending " (copy)" (7 chars) would produce a title >200 chars. Expected behavior is unknown.
- **Given**: An ATC with a title of exactly 197 characters exists.
- **When**: Elena duplicates it without providing a custom title.
- **Then**: Either (a) the source title is truncated to 193 chars before appending " (copy)" producing a 200-char title, OR (b) API returns 422 prompting user to provide a shorter custom title. Confirm expected behavior.

#### Scenario E9: Should treat an empty string new_title as "no title provided" and apply the default (Type: Edge, Priority: Medium)

- **NEEDS PO/DEV CONFIRMATION**: Empty string `""` in the body is ambiguous — is it treated as absent or as a too-short title?
- **Given**: Source ATC exists.
- **When**: Elena calls `POST /atcs/{source_id}/duplicate` with body `{ "new_title": "" }`.
- **Then**: Either (a) API applies default title `"{source title} (copy)"`, OR (b) API returns 422 "title too short". Confirm expected behavior.

#### Scenario E10: Should roll back all inserts when the atc_steps bulk INSERT fails mid-transaction (Type: Integration, Priority: High)

- **NEEDS PO/DEV CONFIRMATION**: Transactional rollback behavior — confirm with Dev.
- **Given**: The DB is configured to simulate a failure during `atc_steps` bulk INSERT (e.g., data integrity violation on one row).
- **When**: Elena duplicates a valid ATC.
- **Then**:
  - The `atcs` INSERT is also rolled back (no orphan ATC row left).
  - API returns HTTP 500 (or a structured error response — confirm with Dev).
  - `atc_assertions` INSERT was never attempted.
  - DB state: identical to pre-request state.

---

## Phase 4 — Test Outlines (DRAFT)

### Coverage estimate

| Type | Count | Notes |
|------|-------|-------|
| Positive | 5 | Happy path variants (default title, custom title, empty source, full metadata copy, redirect) |
| Negative | 4 | Cross-workspace 404, insufficient role 403, title too short 422, title too long 422 |
| Boundary | 4 | Title at min (3 chars), title at max (200 chars), title at max+1 (201 chars), source title near limit (EC-8) |
| Integration | 3 | Transaction rollback on step-INSERT failure, event `atc.created` emission, slug uniqueness on concurrent duplicate |
| **Total** | **16** | Drives PO estimation |

**Rationale**: The story has medium data-validation complexity (title bounds) and medium integration complexity (3-table transaction with atomicity guarantee). The independence invariant (AC4) requires an explicit data-integrity outline. Boundary outlines cover the 3..200 char constraint that is currently absent from the ACs — these are HIGH priority because they directly map to a 422 error path the developer must implement.

### Outline list (NAMES ONLY)

#### Positive

- **Should create a copy with all steps and assertions using the default title** — Pre: ATC "Login happy path" with 3 steps + 2 assertions exists. Expected: 201 + new ATC row + 3 step rows + 2 assertion rows, title = "Login happy path (copy)".
- **Should create a copy with a user-provided custom title** — Pre: ATC "Login happy path" exists. Expected: 201 + new ATC title = "Login with remember-me".
- **Should redirect UI to the new ATC detail page after duplication** — Pre: Authenticated user on ATC detail page. Expected: Browser navigates to `/atcs/{new_id}` on 201 response.
- **Should produce a copy with 0 steps and 0 assertions when source has none** — Pre: Skeleton ATC with 0 steps, 0 assertions. Expected: 201 + new ATC row + 0 step rows + 0 assertion rows.
- **Should copy layer, tags, and anchor IDs from the source ATC** — Pre: ATC with non-default layer, multiple tags, and multiple `acceptance_criterion_ids`. Expected: new ATC row has identical `layer`, `tags`, `user_story_id`, `acceptance_criterion_ids` as source.

#### Negative

- **Should return 404 when duplicating an ATC from another workspace** — Pre: `source_id` belongs to a different workspace than the caller's. Expected: 404, no DB rows inserted.
- **Should return 403 when the requesting user lacks permission to duplicate** — Pre: User with insufficient role. Expected: 403, no DB rows inserted.
- **Should return 422 when the custom title is shorter than 3 characters** — Pre: Valid source ATC. Expected: 422 with validation message, no DB rows inserted.
- **Should return 422 when the custom title exceeds 200 characters** — Pre: Valid source ATC. Expected: 422 with validation message, no DB rows inserted.

#### Boundary

- **Should accept a custom title of exactly 3 characters** — Pre: Valid source ATC. Expected: 201 + new ATC with 3-char title.
- **Should accept a custom title of exactly 200 characters** — Pre: Valid source ATC. Expected: 201 + new ATC with 200-char title.
- **Should reject a custom title of exactly 201 characters** — Pre: Valid source ATC. Expected: 422.
- **Should handle default title computation when source title is near the 200-char limit** — Pre: Source ATC title = 197 chars. Expected: behavior per PO/Dev confirmation (truncate OR 422 asking for custom title).

#### Integration

- **Should roll back all DB inserts when the atc_steps bulk INSERT fails** — Pre: DB failure simulated on step INSERT. Expected: no orphan `atcs` row, atomic rollback, error response.
- **Should emit atc.created event (not atc.duplicated) on successful duplication** — Pre: Event listener monitoring. Expected: exactly one `atc.created` event with the new `atc_id`.
- **Should not clone the slug — generate a fresh slug on duplication** — Pre: Source ATC has slug "login-happy-path-abc123". Expected: new ATC has a different slug derived from the new `atc_id`, not copied from source.

---

## Phase 5 — Edge Cases (DRAFT)

| # | Edge case | In original Story? | Criticality | Action |
|---|-----------|-------------------|-------------|--------|
| 1 | Source title ≥197 chars — "(copy)" suffix pushes title >200 chars | No | High | Add to AC (PO confirm — Scenario E8) |
| 2 | Source ATC has 0 steps and 0 assertions | No | Medium | Add to AC (PO confirm — Scenario E7) |
| 3 | Empty string `""` passed as `new_title` | No | Medium | Technical question for Dev (Scenario E9) |
| 4 | Duplicate triggered twice before first response (double-click) | No | Medium | Technical question for Dev (Scenario EC-3) |
| 5 | Source ATC is soft-deleted / archived | No | Medium | Add to AC (PO confirm — EC-2) |
| 6 | Source AC anchor (`acceptance_criterion_ids`) references a deleted AC | No | Medium | Technical question for Dev (EC-7) |
| 7 | Transaction partial failure — `atc_steps` INSERT fails mid-bulk | No | High | Integration outline added (Scenario E10) |
| 8 | Concurrent duplicate requests generating the same slug | No | Medium | Technical question for Dev (Gap G5) |
| 9 | Read-only workspace member attempts duplication | No | High | Add to AC (PO confirm — EC-6) |
| 10 | `acceptance_criterion_ids` array has multiple entries — all must be copied | No | Medium | Confirm with Dev (AMB-4) |

---

## Story Quality Assessment

**Verdict**: Needs Improvement

**Key findings**:
- The 4 original ACs cover only the success path and the independence invariant. All error paths (404, 403, 422), title boundary constraints, and edge states are absent from the spec.
- The title validation constraint (3..200 chars) from the architect annotation has no corresponding AC — this is a silent implementation detail that QA cannot test without a spec.
- The role/permission model is ambiguous: "Workspace members can duplicate" conflicts with "403 on insufficient role". This must be resolved before sprint planning or the authorization behavior cannot be tested.

---

## Critical Questions for PO

> These BLOCK sprint planning until answered.

1. **Which workspace roles are allowed to duplicate an ATC?**
   - **Context**: Business Rule says "only members of the owning Workspace can duplicate" (implies any member). Architect note says "403 on insufficient role". These may disagree.
   - **Impact if unanswered**: QA cannot write authorization test scenarios. The role gate is a security boundary — wrong spec = authorization bug shipped.
   - **Suggested answer**: Clarify: all workspace members can duplicate (no role restriction), OR only members with role ≥ [Senior QA / Workspace Admin] can duplicate.

2. **What is the behavior when the default "(copy)" suffix would push the title above 200 characters?**
   - **Context**: If source title is ≥197 chars, appending " (copy)" (7 chars) exceeds the 200-char limit.
   - **Impact if unanswered**: Dev may make an ad-hoc choice (truncate vs 422) that QA has not tested.
   - **Suggested answer**: Either (a) truncate source title to 193 chars before appending " (copy)", OR (b) return 422 requiring the user to provide a shorter custom title.

---

## Technical Questions for Dev

> These do not block PO estimation but block implementation.

1. **Slug generation collision window**: Is the slug deterministically derived from the new `atc_id` (UUID-based, collision-free), or derived from the title? If title-based, what is the deduplication strategy under concurrent duplicate requests?
   - Testing impact: If title-based, a "concurrent duplication" integration outline must be added. If ID-based, the risk is low.

2. **Empty string `""` as `new_title`**: Should the server treat `{ "new_title": "" }` as "no title provided" (apply default) or as a too-short title (422)? What does the OpenAPI schema say — `required: false` with nullable, or `minLength: 3` on the optional field?
   - Testing impact: Determines whether an empty-string outline is positive or negative.

3. **Soft-deleted / archived ATCs**: Does Bunkai use soft-delete on ATCs (an `archived` or `deleted_at` flag)? If yes, what HTTP status does `POST /atcs/{archived_id}/duplicate` return — 404 or a specific error?
   - Testing impact: Determines whether EC-2 outline is needed and what the expected status is.

4. **Orphaned `acceptance_criterion_ids`**: If the source ATC's `acceptance_criterion_ids` array references an AC that no longer exists (deleted after the ATC was created), does the duplicate inherit the dangling IDs silently, raise an error, or filter them out?
   - Testing impact: Determines whether an orphaned-anchor scenario must be tested.

5. **`atc_steps` bulk INSERT failure behavior**: Confirm that the `BEGIN ... COMMIT` transaction rolls back the `atcs` INSERT if the `atc_steps` bulk INSERT fails. Is this enforced at the DB level (FK + trigger) or only at the application service layer?
   - Testing impact: Integration outline E10 requires knowing the observable error response shape (500 vs structured error).

---

## Suggested Story Improvements

| # | Current state | Suggested change | Benefit |
|---|---------------|------------------|---------|
| 1 | No AC covers 404, 403, or 422 responses | Add Negative ACs for all 3 error cases with exact status codes and response body shapes | Gives Dev a testable contract; prevents silent implementation of undocumented error paths |
| 2 | Title constraint (3..200) lives only in architect comment | Move title length rule to the Business Rules table in the Story | PO and Dev both see the constraint; QA can write boundary scenarios without reading Jira comments |
| 3 | "In one click" phrasing conflicts with "optionally typing a new title" | Replace "in one click" with "in a single action from the ATC detail view" and specify the UI affordance (modal vs inline) | Removes ambiguity; test steps can reference the actual component |
| 4 | Business Rule "Provenance" does not specify whether ALL `acceptance_criterion_ids` are copied or only the primary | Add explicit rule: "All `acceptance_criterion_ids` from the source are copied to the duplicate without modification" | Prevents incomplete copy behavior going undetected |

---

## Data feasibility flags

No data feasibility risks identified for shift-left analysis. The feature does not exist yet — no production data required. During in-sprint testing, QA will need:

- **Required pre-work**: BK-18 (FR-010a) must be merged before BK-23 can be tested. This is an explicit upstream dependency stated in the architect annotation.
- **Entity / fixture**: A seeded ATC with at least 3 steps and 2 assertions in a staging workspace is needed for AC1 / Scenario 1.1. This can be created via the ATC authoring feature (assumed available after BK-18 lands).
- **API contract gap**: The exact 422 response body shape (field names, message text) is not yet defined in the story. QA will need the OpenAPI spec or Dev confirmation before writing assertions.

---

## Recommended testing strategy

### Pre-implementation

- Resolve Critical Questions Q1 and Q2 with PO before Dev picks up the story.
- Confirm Technical Questions TQ2 (empty string) and TQ3 (soft-delete) with Dev at story kickoff.
- Verify BK-18 (FR-010a) is merged and the `createAtc()` service function + slug computation are stable before BK-23 implementation begins.

### During implementation

- Dev should add unit tests for the `duplicateAtc()` service function covering: happy path, 0-step source, title truncation edge case, transaction rollback.
- API contract test for `POST /atcs/{source_id}/duplicate` should be added against the OpenAPI spec as part of the PR.
- QA should confirm the 422 error response body shape with Dev during implementation so integration outlines can be finalized.

### Post-implementation (in-sprint by /sprint-testing)

- Execute all 16 outlined test scenarios (5 positive, 4 negative, 4 boundary, 3 integration).
- Verify DB independence invariant: after editing the copy's step 1, assert source step 1 is unchanged via direct DB query or API GET.
- Verify the `atc.created` event is emitted (not `atc.duplicated`) — check event log or downstream consumer.
- Verify slug of the copy is distinct from the source slug.
- Verify UI redirect lands on the new ATC detail page with correct data rendered.

---

## Risks & mitigation

| # | Risk | Likelihood | Impact | Mitigated by which outlines |
|---|------|-----------|--------|-----------------------------|
| 1 | Transaction partially applies (orphan `atcs` row without steps) | Low | High | Integration outline: "Should roll back all DB inserts when atc_steps bulk INSERT fails" |
| 2 | Slug cloned from source causing duplicate slug constraint violation | Low | Medium | Boundary outline: "Should not clone the slug — generate a fresh slug on duplication" |
| 3 | Authorization gate not implemented — any unauthenticated user can duplicate via API | Medium | High | Negative outline: "Should return 403 when requesting user lacks permission to duplicate" |
| 4 | Default title overflows 200-char limit silently producing a truncated or erroring title | Medium | Medium | Edge outline: "Should handle default title computation when source title is near the 200-char limit" |
| 5 | BK-18 delay blocks BK-23 from being testable in the sprint | Medium | High | Upstream dependency — flag at sprint planning; do not pull BK-23 into sprint until BK-18 is merged |

---

## Next steps

- [ ] PO answers Critical Questions Q1 (role gate) and Q2 (title overflow on default) before sprint planning
- [ ] Dev answers Technical Questions TQ2 (empty string), TQ3 (soft-delete), TQ4 (orphaned anchor IDs), TQ5 (rollback) before estimation
- [ ] Confirm BK-18 (FR-010a) will land in the same sprint or before BK-23 is scheduled
- [ ] Story enters sprint at status `Ready For Dev` once estimated and questions are resolved
- [ ] When Story reaches `Ready For QA`, `/sprint-testing` will short-circuit refinement (label `shift-left-reviewed` detected)

---

## missing_input note

The following context files were not available during this refinement session:
- `.context/business/business-feature-map.md` — not yet generated
- `.context/business/business-api-map.md` — not yet generated

Analysis proceeded using ticket inline context (architect annotation by Ely) and `business-data-map.md`. The missing files would have provided endpoint catalog cross-reference and RLS policy detail. No blocking gaps identified from their absence for this story.

# Shift-Left Refinement — BK-45
Story: TMS-Traceability | Render full US to bug evidence chain in one read
Epic: BK-44 — Coverage & Traceability
Refined on: 2026-06-11
Risk level: HIGH
TMS modality: jira-native
Status: Refined — Awaiting PO Estimation

---

## 1. Critical Analysis

### 1.1 Scope Summary — What This Story Does, Its Place in the System

BK-45 introduces a read-only **Traceability View** for a User Story. The view must assemble and present a vertical chain of 5 layers in a single screen:

```
User Story
  └── Acceptance Criterion [1..N]
        └── ATC [0..N per AC]
              └── Test (chain of ATCs) [0..1 per ATC]
                    └── Latest Run Result [0..1 per Test]
                          └── Linked Defect [0..N per Run]
```

This is a **pure read/display feature** — no writes, no transitions. Its value proposition is audit speed: the QA Lead should never need to click into 5 separate entities to reconstruct coverage. From a system architecture perspective, BK-45 is the first feature that joins entities from three independent capability groups that are currently **not implemented** (Tests, Runs, Defects). It is a visualization layer sitting on top of upstream data that does not yet exist.

The story was created on 2026-06-01, updated 2026-06-10, and is currently in **Shift-Left QA** status with no SP estimate. It is a child story within the **Coverage & Traceability** epic (BK-44).

### 1.2 Dependencies — Upstream / Downstream

| Direction | Story / Epic Key | Status | Key Contract |
|---|---|---|---|
| Upstream (BK-45 consumes) | BK-24 — Tests (chains of ATCs) | Planificación | `tests` table must exist and link ATCs; BK-45 reads from it |
| Upstream (BK-45 consumes) | BK-30 — Manual Execution & Runs | Planificación | `test_runs` / `run_results` tables must exist with a `latest run result` query contract |
| Upstream (BK-31 consumes) | BK-31 — Bugs & Defect Heatmap | Planificación | `defects` / `bugs` table must exist, linked to a run or run result |
| Upstream (BK-45 reads) | Existing: User Stories, ACs, ATCs | Active in production | `user_stories`, `acceptance_criteria`, `atcs`, `atc_acceptance_criteria` tables exist and are stable |
| Downstream (blocked by BK-45) | BK-50 — TMS-Traceability: Export chain as read-only snapshot | Shift-Left QA | BK-50 must render the same chain structure that BK-45 assembles; BK-50 is a consumer of BK-45's data contract |

**Critical finding**: BK-24, BK-30, and BK-31 are all in **Planificación** — none are in development or done. This means the 3 upstream entities (Tests, Runs, Defects) that form the bottom half of the chain have **no data model, no API, and no schema** at the time of this refinement. BK-45 cannot be completed until at least BK-24, BK-30, and BK-31 provide working schemas and data.

### 1.3 Feasibility Notes

**What exists today (can be tested immediately):**
- `user_stories` table — Active. US can be read via `GET /api/v1/user-stories/{id}`.
- `acceptance_criteria` table — Active. ACs can be listed via `GET /api/v1/user-stories/{id}/acceptance-criteria`.
- `atcs` table + `atc_acceptance_criteria` (M:N binding) — Active. ATCs are bound to ACs via `bunkai_save_atc` RPC.
- AC → ATC join is possible today (DB table `atc_acceptance_criteria`).

**What does NOT exist (blocks full chain rendering):**
- No `tests` table or any Test/chain-of-ATCs entity in the DB schema (confirmed: 20 migrations reviewed, no `tests`, `test_chains`, or `test_suites` table).
- No `test_runs` or `run_results` table — explicitly flagged as "Sprint 2 stub" and "Not yet implemented" in the feature map.
- No `defects` or `bugs` table — explicitly flagged as "Not yet implemented" in the feature map.
- No dedicated `GET /api/v1/user-stories/{id}/traceability` endpoint — must be designed and built for this story.
- No ATC-to-Test relationship exists in any form (BK-24 is the blocker).

**Testability window:** Only the top 2 layers (US → AC → ATC) can be exercised today. The bottom 3 layers (Test, Run, Defect) depend entirely on BK-24, BK-30, and BK-31 landing in sprint first.

---

## 2. Story Quality Analysis

### 2.1 Ambiguities Found

| # | Location in Story | Question for PO / Dev | Impact on Testing | Suggested Clarification |
|---|---|---|---|---|
| A1 | AC: "the tests they belong to" | What is a "Test" in BK-45 context? Is it an ATC-chain (from BK-24), a test execution record, or something else? The word "test" is used in two senses in the system (ATC = atomic test component vs. a higher-level Test entity). | Cannot design test outlines for the Test layer without knowing the entity model. | Clarify: "Test" = a named chain-of-ATCs entity as defined by BK-24. If different, define the entity. |
| A2 | AC: "the latest run result" | "Latest" by what ordering — last created_at, last executed_at, or last status update? What if multiple runs exist for the same test? | Boundary test for "latest" ordering requires knowing the sort key. | Specify: `ORDER BY executed_at DESC LIMIT 1` or equivalent. |
| A3 | AC: "any linked defect" | Is a defect linked to a Run, a Run Result, an ATC, or the User Story itself? The link source determines the join path. | Integration test design depends entirely on which FK relationship exists. | Specify the FK: defect.run_result_id, defect.run_id, or defect.user_story_id. |
| A4 | AC: "opens its traceability view" | Where is this view accessible from? A dedicated route `/user-stories/{id}/traceability`? A panel on the existing US page? A modal? | Affects which URL/component the E2E tests target. | Define the route or UI entry point explicitly. |
| A5 | AC: "each acceptance criterion with its ATCs" | Are ATCs displayed per AC (showing only ATCs bound to that specific AC), or all ATCs in the story's scope? For a multi-AC story, an ATC might be bound to 2 ACs — does it appear twice or once? | Determines whether rendering logic must deduplicate or not. | Clarify: ATCs shown once per AC binding (may repeat across ACs) vs. deduplicated per story. |
| A6 | Scenario 2: "marks the run and defect levels as 'no data yet'" | Is "no data yet" exact UI text? Is it a single badge, an empty state row, or an icon? | Assertion text in automated tests must match the actual rendered string. | Provide exact copy or a `data-testid` so QA can assert without coupling to text. |
| A7 | Story overview | What user roles can access the traceability view? QA Lead, Member, Viewer? Is this a workspace-role-gated feature or open to all authenticated members? | Negative tests for unauthorized access require knowing the role boundary. | Define minimum role required (or confirm all authenticated members can view). |

### 2.2 Gaps (Missing ACs / Behaviors Not Described)

| # | Type | Why Critical | What to Add | Risk If Omitted |
|---|---|---|---|---|
| G1 | Missing AC | Role-based access control for the view is not defined anywhere in the story | Add AC: only authenticated workspace members with at least `viewer` role may access the traceability view; unauthenticated users are redirected to login | A public-facing traceability view could expose audit data to non-members |
| G2 | Missing AC | Archived / soft-deleted ACs and ATCs behavior not specified | Add AC: archived ACs and archived ATCs must NOT appear in the chain, even if they have historical run results | Showing archived entities would misrepresent current coverage posture |
| G3 | Missing AC | Story with ACs but some ACs have ATCs and others do not | Add AC: for each AC without ATCs, the chain renders that AC with an "uncovered" indicator and shows no ATC rows below it | Partial coverage (most common real-world case) is entirely missing from the 3 ACs |
| G4 | Missing AC | Performance / timeout behavior for large stories not described | Add AC: the view must render within an acceptable time for a story with a high number of ACs and ATCs (suggest threshold: define max) | For large projects a naive N+1 query join could cause page timeouts |
| G5 | Missing AC | Defect status / open vs. closed not mentioned | Add AC: linked defects must display their current status (e.g. open, resolved, closed) so the QA Lead can distinguish active quality risk from resolved issues | Without status, the chain shows defects but cannot answer "is this risk still open?" |
| G6 | Missing AC | What happens when the traceability view is opened for an archived / soft-deleted User Story? | Add AC: accessing the traceability view for an archived story returns a clear "this story has been archived" message rather than an empty chain | Without this, QA/audit users may interpret an archive as "no coverage" |
| G7 | Missing AC | What happens if the Test linked to an ATC has been deleted (if Tests are soft-deletable per BK-24)? | Add AC: ATCs whose parent Test has been archived show the ATC with "test archived" indicator rather than a broken chain | This depends on BK-24's delete model — **NEEDS PO/DEV CONFIRMATION** |

### 2.3 Untestable or Vague ACs

| # | AC / DoD Item | Issue | Fix |
|---|---|---|---|
| V1 | "in one read" (Scenario 1) | "One read" is UX language, not a testable assertion. Does it mean: single HTTP request, single page load without pagination, all data visible above the fold, or something else? | Replace with: "the traceability view renders all chain layers for the given story in a single page load, without requiring navigation to additional pages or tabs" |
| V2 | "clearly states the story has no coverage" (Scenario 3) | "Clearly states" is subjective and untestable. What exact string, component, or indicator constitutes "clearly states"? | Replace with: "the view displays an empty-state message containing a defined string (e.g., 'No ATCs linked to this story's acceptance criteria') and no chain rows are rendered" |
| V3 | "shows no broken or empty chain rows" (Scenario 3) | "Broken or empty chain rows" is ambiguous — does "broken" mean a row with a null value, an error state, or a placeholder? | Replace with: "the view renders zero chain rows; no placeholder rows, loading spinners, or null-value cells appear for ATC, Test, Run, or Defect columns" |
| V4 | "marks the run and defect levels as 'no data yet'" (Scenario 2) | "No data yet" is either exact UI copy or a description of intent. If it is exact copy it must be defined as the canonical string; if not, a `data-testid` should anchor the assertion. | Define: either confirm exact copy is `"No data yet"` (case-sensitive) or provide `data-testid` attributes for these placeholder cells |

### 2.4 Edge Cases Not in the Story

| # | Scenario | Expected Behavior (Best Guess) | Criticality | Action |
|---|---|---|---|---|
| E1 | A User Story has 0 ACs (story in `draft` status — allowed by data model) | View renders a "no acceptance criteria" empty state; the story cannot be `ready_to_test` in this state | HIGH | Add to AC or at minimum to test outlines |
| E2 | An AC has 100+ ATCs bound to it | View renders all 100+ ATCs without truncation or performance degradation; pagination or virtualization may be needed | HIGH | **NEEDS PO/DEV CONFIRMATION** — confirm whether pagination is planned or all ATCs must be visible |
| E3 | The same ATC is bound to multiple ACs on the same story | Each AC row shows the ATC in its own chain segment; the ATC is displayed once per binding (repeated) | MEDIUM | Clarify with Dev: is deduplication applied? |
| E4 | Two concurrent runs exist for the same Test | Only the latest run (by defined sort key — see A2) is shown; the older run is not visible in the chain | HIGH | Depends on "latest" definition — must be confirmed |
| E5 | A defect linked to the run has been deleted / closed | Closed defect still appears in chain but shows `status = closed`; the QA Lead is not misled into thinking the chain is clean | HIGH | **NEEDS PO/DEV CONFIRMATION** — depends on BK-31 defect lifecycle |
| E6 | All 5 chain layers are populated but the associated workspace is not the caller's active workspace | View returns 403 or redirects to login; no cross-workspace data leaks | CRITICAL | Must be included as a security negative test |
| E7 | User Story exists but belongs to an archived module | **NEEDS PO/DEV CONFIRMATION** — whether a US in an archived module can still be viewed for traceability or is itself inaccessible | HIGH | Clarify archival cascade behavior for the traceability context |
| E8 | Run exists but its status is `running` (in-progress) | Chain renders the in-progress run with a `running` status indicator rather than a final result | MEDIUM | **NEEDS PO/DEV CONFIRMATION** |
| E9 | Story has ACs and ATCs but zero Tests built from those ATCs (BK-24 not yet linked) | Chain renders to ATCs and marks the Test and Run levels as "no data yet" (similar to Scenario 2 but at a different layer) | HIGH | Partially covered by Scenario 2 — clarify whether Scenario 2 specifically means "ATC exists but no test" or "no ATC at all" |
| E10 | Chain data is consistent but extremely deep (story with 20 ACs, each with 5 ATCs) | View remains usable; layout does not overflow or become illegible | MEDIUM | UX/performance concern — **NEEDS PO/DEV CONFIRMATION** on layout strategy |

---

## 3. Refined Acceptance Criteria

### Original AC-01 — Full chain display (covered story)

```gherkin
Scenario: Open the evidence chain for a fully covered user story
  Given a workspace member with at least viewer role
  And a user story in an active module with:
    | acceptance_criteria | 1 or more active ACs |
    | ATCs                | at least 1 ATC bound to each AC |
    | Tests               | at least 1 Test containing each ATC |
    | Runs                | at least 1 completed run for each Test |
    | Defects             | at least 1 defect linked to a run result |
  When the member navigates to the traceability view for that user story
  Then the view renders a single-page chain without additional navigation
  And for each acceptance criterion the view shows: the AC title
  And for each ATC bound to that AC: the ATC title and layer (UI/API/Unit)
  And for each Test containing that ATC: the Test name
  And for each Test: the single latest run result with its status (pass/fail/blocked/skipped)
  And for each run result: any linked defect(s) with their ID, title, and current status
```

### Original AC-02 — Partial coverage (ATCs exist, no run yet)

```gherkin
Scenario: Open the traceability view for a partially covered user story
  Given a workspace member with at least viewer role
  And a user story with at least one AC that has ATCs bound but no Test runs recorded
  When the member navigates to the traceability view for that user story
  Then the chain renders from the User Story down through the ATC layer
  And for the Test layer: a "no data yet" placeholder is shown for each ATC without a linked Test
  And for the Run layer: a "no data yet" placeholder is shown
  And for the Defect layer: a "no data yet" placeholder is shown
  And no broken or null-value cells appear in the rendered chain
```

**NEEDS PO/DEV CONFIRMATION** — "no data yet" must be confirmed as exact UI copy or replaced with a `data-testid`.

### Original AC-03 — No coverage

```gherkin
Scenario: Open the traceability view for a user story with no ATCs linked
  Given a workspace member with at least viewer role
  And a user story whose acceptance criteria have no ATCs bound
  When the member navigates to the traceability view for that user story
  Then the view displays a defined empty-state message indicating no coverage
  And zero chain rows are rendered for ATC, Test, Run, or Defect layers
  And no placeholder rows, loading spinners, or null-value cells appear
```

**NEEDS PO/DEV CONFIRMATION** — exact empty-state copy must be defined.

### Added AC-04 — AC with no ATCs within a partially covered story

```gherkin
Scenario: User story has some ACs covered and some ACs uncovered
  Given a user story with 2 or more active acceptance criteria
  And at least one AC has ATCs bound to it
  And at least one AC has no ATCs bound
  When the member navigates to the traceability view for that user story
  Then each AC with ATCs shows its ATC chain normally
  And each AC without ATCs displays an "uncovered" indicator at the ATC layer
  And no broken chain rows appear for the uncovered AC
```

**NEEDS PO/DEV CONFIRMATION** — exact "uncovered" indicator copy or component.

### Added AC-05 — Role-based access

```gherkin
Scenario: Unauthenticated user attempts to access a traceability view
  Given a URL for a valid traceability view
  When an unauthenticated user navigates to that URL
  Then the application redirects to the login page
  And no chain data is rendered before the redirect
```

```gherkin
Scenario: Authenticated user from a different workspace attempts to access a traceability view
  Given a valid traceability view URL for Workspace A
  And an authenticated user who is a member only of Workspace B
  When that user navigates to the URL
  Then the application returns a 403 Forbidden response or equivalent access-denied UI
  And no chain data from Workspace A is exposed
```

### Added AC-06 — Archived entities excluded from chain

```gherkin
Scenario: Traceability view excludes archived ACs and ATCs
  Given a user story with one active AC and one archived AC
  And the active AC has one active ATC and the archived AC has one archived ATC
  When the member navigates to the traceability view for that user story
  Then only the active AC appears in the chain
  And only the active ATC appears in the chain
  And the archived AC and its archived ATC are not rendered
```

### Added AC-07 — Story with zero ACs

```gherkin
Scenario: Open the traceability view for a story with no acceptance criteria
  Given a user story in draft status with no acceptance criteria
  When the member navigates to the traceability view for that user story
  Then the view displays a defined empty-state message indicating no acceptance criteria
  And no chain rows are rendered for AC, ATC, Test, Run, or Defect layers
```

**NEEDS PO/DEV CONFIRMATION** — exact empty-state copy.

---

## 4. ATP DRAFT — Test Outline

### Coverage Estimate

| Type | Count |
|---|---|
| Positive | 10 |
| Negative | 6 |
| Boundary | 3 |
| Integration | 4 |
| **Total** | **23** |

### Rationale

The count is driven by the 5-layer chain depth. Each layer introduces at least one positive happy-path outline and one "no data" state. The negative suite is relatively lean (6) because the view is read-only — there are no write paths to abuse — but role isolation and cross-workspace leakage must be covered with dedicated tests given the HIGH audit risk of the feature. Boundary tests focus on empty and max-depth chain scenarios. Integration tests cover the join correctness of all 5 entities end-to-end, which carries the highest residual risk given that 3 of the 5 entity types do not yet exist.

### Outlines

#### Positive (10)

1. **Full 5-layer chain renders without error**
   - Pre: US with 1 AC → 1 ATC → 1 Test → 1 completed Run → 1 Defect
   - Expected: All 5 layers visible; correct title/status at each layer; no loading errors

2. **Multiple ACs each with their own ATCs render as separate segments**
   - Pre: US with 3 ACs, each with 2 ATCs bound
   - Expected: 3 AC segments rendered; each shows its own 2 ATCs; no cross-AC bleed

3. **Chain renders correctly when latest run status is "pass"**
   - Pre: US → AC → ATC → Test → Run (status = pass); no defect
   - Expected: Run layer shows pass indicator; Defect layer shows "no data yet" or equivalent

4. **Chain renders correctly when latest run status is "fail"**
   - Pre: US → AC → ATC → Test → Run (status = fail) → 1 linked defect
   - Expected: Run layer shows fail indicator; Defect layer shows defect ID + title + status

5. **Chain renders correctly when latest run status is "blocked"**
   - Pre: Run (status = blocked) → 1 linked defect
   - Expected: Run layer shows blocked indicator; Defect layer shows defect with current status

6. **"No run yet" state renders correctly (Scenario 2 — existing AC-02)**
   - Pre: US → AC → ATC; no Test, no Run
   - Expected: Chain visible to ATC layer; Test and below show placeholder

7. **"No coverage" state renders correctly (Scenario 3 — existing AC-03)**
   - Pre: US with 2 ACs, no ATCs bound to either
   - Expected: Empty-state message; zero chain rows

8. **Partial coverage: mixed ACs (some covered, some not)**
   - Pre: US with 2 ACs; AC-1 has 1 ATC, AC-2 has none
   - Expected: AC-1 chain shows ATC; AC-2 shows "uncovered" indicator

9. **Viewer-role member can access the traceability view**
   - Pre: Authenticated user with `viewer` workspace role navigates to traceability URL
   - Expected: Full chain renders without 403 or redirect

10. **Story with zero ACs shows empty-state for no acceptance criteria**
    - Pre: US in draft with 0 active ACs
    - Expected: Specific empty-state message for "no ACs"; no chain rows

#### Negative (6)

11. **Unauthenticated access redirects to login**
    - Pre: Valid traceability URL; no auth cookie or Bearer token
    - Expected: Redirect to `/login`; no chain data rendered

12. **Cross-workspace access returns 403**
    - Pre: Authenticated member of Workspace B navigates to Workspace A traceability URL
    - Expected: 403 or access-denied UI; no Workspace A data leaked

13. **Invalid User Story ID returns 404**
    - Pre: Traceability URL for a non-existent US ID
    - Expected: 404 page or equivalent; no chain rendered

14. **Traceability view for archived User Story is blocked or flagged**
    - Pre: US that has been soft-archived
    - Expected: View shows "story archived" message or returns 404; no chain renders as if active
    - **NEEDS PO/DEV CONFIRMATION** — archived US behavior in this view is unspecified

15. **Archived ACs do not appear in the chain**
    - Pre: US with 1 active AC and 1 archived AC, each with ATCs
    - Expected: Only active AC and its ATCs appear; archived AC invisible

16. **Run in "running" state does not show misleading result**
    - Pre: Test has a run currently in `running` status
    - Expected: Run layer shows `running` indicator, not a pass/fail result
    - **NEEDS PO/DEV CONFIRMATION** — confirm `running` status must be visible vs. excluded

#### Boundary (3)

17. **Story with 1 AC and 1 ATC (minimum populated chain)**
    - Pre: Minimum-viable full chain
    - Expected: All layers render; no layout issues at minimum row count

18. **Story with 0 ACs (empty chain — minimum empty)**
    - Pre: US with no ACs
    - Expected: Empty-state message; no JS errors

19. **Story with large AC / ATC count (stress boundary)**
    - Pre: US with 10 ACs, each with 5 ATCs = 50 ATC rows **NEEDS PO/DEV CONFIRMATION** on acceptable threshold
    - Expected: View renders within defined latency threshold; layout does not overflow; all rows visible (with scroll if needed)

#### Integration (4)

20. **AC → ATC join correctness: ATC appears under its bound AC only**
    - Pre: 2 ACs, ATC-A bound to AC-1 only, ATC-B bound to AC-2 only
    - Expected: ATC-A under AC-1, ATC-B under AC-2; no cross-joining

21. **ATC → Test → Run join: latest run selection accuracy**
    - Pre: Same Test has 2 runs (run-1 older, run-2 newer)
    - Expected: Chain shows run-2 data only; run-1 not visible
    - **NEEDS PO/DEV CONFIRMATION** — confirm sort key for "latest"

22. **Run → Defect join: multiple defects on one run**
    - Pre: Run result has 2 linked defects
    - Expected: Both defects visible in chain under that run; neither omitted

23. **Full 5-layer chain consistency after ATC is rebound to a different AC**
    - Pre: ATC was bound to AC-1, then unbound and rebound to AC-2 via editor
    - Expected: Traceability view reflects the current binding (AC-2 chain); AC-1 shows no ATC for that ATC ID
    - **NEEDS PO/DEV CONFIRMATION** — depends on whether rebinding is atomic in `bunkai_save_atc`

---

## 5. Edge Cases — Extended Scan (HIGH Risk)

| # | Edge Case | Criticality |
|---|---|---|
| EC1 | Unauthenticated user accesses a valid traceability URL | CRITICAL — no auth = data leak risk |
| EC2 | Authenticated cross-workspace user accesses traceability URL (RLS bypass potential) | CRITICAL — tenant isolation; admin Supabase client bypass pattern exists in codebase |
| EC3 | ATC bound to AC in Story A, ATC is reused in a Test that also covers Story B — chain may show wrong story context | HIGH — shared ATC reuse across stories; BK-24 join logic unknown |
| EC4 | All 3 upstream entities (Tests, Runs, Defects) are empty; chain must render gracefully without null pointer errors | HIGH — most probable state at sprint start; chain must not crash |
| EC5 | Run status is `running` (in-flight) when traceability view is loaded | HIGH — misleading if shown as no-result; UI must handle intermediate state |
| EC6 | Story with 50+ ATC rows (large coverage matrix) causes N+1 query per ATC | HIGH — without a purpose-built join endpoint, naive implementation will be O(N) DB calls per AC |
| EC7 | ATC exists in DB but its parent module has been archived — ATC appears as "ghost" in chain | HIGH — `archived_at IS NULL` filter exists on ATCs but the module cascade may leave edge records |
| EC8 | Two runs have identical `executed_at` timestamps (race condition or bulk insert) | HIGH — "latest" sort is non-deterministic; need tiebreaker (e.g., `created_at` or `id`) |
| EC9 | Defect linked to a run result that belongs to a different story's chain | HIGH — defect FK points to run, not to story; a QA Lead could see another story's defects if join is not scoped correctly |
| EC10 | Story has ACs in reordered positions (non-sequential, e.g., positions 1, 3, 7) | MEDIUM — chain should render ACs in position order regardless of gaps |
| EC11 | User Story is in `draft` status (not `ready_to_test`) — is the traceability view accessible? | HIGH — story lifecycle does not gate this view per current ACs; must confirm **NEEDS PO/DEV CONFIRMATION** |
| EC12 | Workspace has an active Jira import job running during traceability load — partial ACs in flux | MEDIUM — import upserts ACs; if mid-import load, chain may show inconsistent AC count |

---

## 6. Open Questions for PO / Dev

### For PO

1. **(A4 + V1) — Route and entry point**: Where is the traceability view accessible from in the UI? Is it a dedicated route (e.g., `/user-stories/{id}/traceability`), a panel on the existing story page, or a modal? This directly determines which URL the automated tests navigate to.

2. **(A2) — "Latest" run definition**: What defines the "latest" run result when multiple runs exist for the same Test? Last `executed_at` DESC? Last `created_at` DESC? Is there a tiebreaker when timestamps collide?

3. **(A3) — Defect link source**: Which entity does a defect link to? `run_result_id`, `run_id`, or directly to `user_story_id`? This determines the join path in the traceability query and is needed before any test outlines for the Defect layer can be finalized.

4. **(G3 + AC-04) — Partial coverage indicator**: What should the chain show for an AC that has no ATCs? An "uncovered" badge? A dimmed empty row? Confirm exact copy or `data-testid` to anchor assertions.

5. **(A7 + AC-05) — Role gate**: Which workspace roles can access the traceability view? All authenticated members (viewer+), or is it restricted to `member` / `admin` / `owner` only?

6. **(G6 + negative-14) — Archived User Story behavior**: If a QA Lead navigates to the traceability view for a soft-archived story, what should happen? 404, an "archived" banner, or full chain visible read-only?

7. **(SP Challenge) — Story Points**: BK-45 currently has no SP estimate. Given that the feature requires a 5-entity join endpoint that does not exist, a new UI view/component, and all 3 downstream entity types (Tests, Runs, Defects — BK-24, BK-30, BK-31) are in Planificación with no schema yet, this story is **not ready for sprint planning** until its upstream dependencies deliver working schemas. Recommend SP = 5–8 once dependencies are unblocked, or split into:
   - **BK-45a**: Render US → AC → ATC chain only (available now, SP 3)
   - **BK-45b**: Extend chain with Test → Run → Defect once BK-24/BK-30/BK-31 land (SP 5)

### For Dev

1. **(G4 + EC6) — Query strategy for chain assembly**: Will a single SQL JOIN query assemble the full 5-layer chain, or will the frontend make multiple sequential API calls (one per layer)? A naive N+1 approach (one call per ATC to get its Test, one call per Test to get its Run) will have unacceptable latency for stories with 20+ ATCs. Recommend a purpose-built endpoint `GET /api/v1/user-stories/{id}/traceability` that returns the full chain in one DB join. Confirm approach before test design for integration test outlines (TC-20–23).

2. **(A5 + EC3) — ATC deduplication across ACs**: If an ATC is bound to 2 ACs on the same story, does it appear in each AC's chain segment (duplicated) or only once with multi-AC labels? This affects assertion logic in TC-20.

3. **(EC7) — Ghost ATCs after module archive**: The cascade from `bunkai_archive_module_subtree` sets `archived_at` on ATCs. Confirm that the traceability query always filters `archived_at IS NULL` on ATCs, or whether a recently archived ATC could briefly appear in the chain before the filter propagates.

4. **(EC8) — Run tiebreaker for "latest"**: If two runs have the same `executed_at`, what is the tiebreaker for determining the "latest" to display? `id DESC`? Confirm before implementing TC-21.

---

## 7. QA Summary

### Risk Assessment

**BK-45 is rated HIGH risk** for the following reasons:

1. **Upstream dependency risk (CRITICAL blocker)**: The bottom 3 of 5 chain layers (Tests via BK-24, Runs via BK-30, Defects via BK-31) depend on epics that are entirely in Planificación — no schema, no API, no data. BK-45 cannot be sprint-complete until all three upstream epics deliver working entities. This is the single largest scheduling risk.

2. **Security surface**: The traceability view joins data across multiple entities and could, if the query is not properly scoped, expose data across workspaces. The codebase already has an admin Supabase client that bypasses RLS (used for auth bootstrapping). If the traceability query mistakenly uses the admin client, tenant isolation fails silently.

3. **Query complexity**: Assembling a 5-entity join in a single performant query is non-trivial. N+1 implementations are the path of least resistance for developers under sprint pressure, and at 20 ACs × 5 ATCs = 100 ATC rows, N+1 becomes a reliability issue, not just a performance concern.

4. **Vague ACs**: 3 of the original 3 ACs contain untestable language ("in one read", "clearly states", "broken or empty chain rows"). All 3 need rewriting before sprint planning.

### SP Estimate Recommendation

**Recommended: Do not assign SP until upstream dependencies are confirmed for the same sprint.**

If BK-24, BK-30, and BK-31 will land in the same sprint:
- Full story (all 5 layers): **SP 8** (new endpoint + new UI component + 5-entity join + role gating + empty states)

If only BK-24 lands in the same sprint (ATC → Test layer):
- Partial story (US → AC → ATC → Test only, Runs and Defects as placeholders): **SP 5**

If none of the upstream epics land in the same sprint:
- Story is not actionable; recommend moving to backlog until at least BK-24 is in Ready For Dev.

Current SP: unset. Recommend PO challenge: this story was estimated as a single Historia but functionally requires 3 upstream epics to be complete. The appropriate estimation unit is SP 8 with a hard dependency on BK-24 + BK-30 + BK-31 being in sprint or already done.

### Main Risk Areas

| Risk | Severity | Mitigation |
|---|---|---|
| Upstream epics BK-24 / BK-30 / BK-31 not available in sprint | CRITICAL | Block sprint entry until dependency confirmed; split story if needed |
| Cross-workspace data leak via traceability join | HIGH | Mandatory security negative test (TC-12); code review of Supabase client used in query |
| N+1 query causing page timeout on large stories | HIGH | Require single-join endpoint design; performance boundary test (TC-19) |
| Vague ACs accepted without confirmation | HIGH | Block sprint planning until A2, A3, A4, V1–V4 are answered by PO |
| "Latest run" ordering undefined | HIGH | Confirm sort key before implementing TC-21 |

### Recommended Next Steps

1. **PO action (before estimation)**: Answer open questions 1–6 in §6. Particularly A2 (sort key), A3 (defect FK), and A4 (route) are sprint-blocking.
2. **Dev action (before sprint planning)**: Confirm query strategy (§6 Dev Q1) and choose single-endpoint vs. multi-call approach.
3. **Dependency check**: Confirm sprint sequencing of BK-24, BK-30, BK-31 relative to BK-45. If upstream epics are not in the same sprint, recommend splitting BK-45 into BK-45a (US→AC→ATC) and BK-45b (Test→Run→Defect extension).
4. **AC refinement**: Replace AC-01–03 with the refined Gherkin in §3 and add AC-04–07 to the Jira story before sprint commitment.
5. **SP re-estimate**: Run estimation session with Dev team using refined ACs and confirmed scope. Recommend SP 8 for full story or SP 5 for partial (BK-45a).

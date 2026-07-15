# Shift-Left Refinement: BK-48 — TMS-Traceability | Filter the chain by verdict, module, and date range

**Status**: Refined — Awaiting PO Estimation
**Mode**: Shift-Left (pre-sprint, batch grooming)
**Refined on**: 2026-06-16
**Refined by**: QA — Shift-Left batch session
**Modality**: Jira-native

---

## Phase 1 — Critical Analysis

### Business context
- **Primary persona affected**: Senior QA Engineer — needs to narrow the evidence chain (US → AC → ATC → Test → Run → Defect) to "what failed, where, and when" without scrolling full history.
- **Secondary personas (if any)**: QA Lead / Product Owner — consumes the filtered view during audit or release-readiness review (inherited persona model from `business-data-map.md` §Actors Model).
- **Business value proposition**: Removes manual spreadsheet assembly / manual scrolling when answering "what's broken in module X this sprint" — directly supports the Epic's stated value of a "one-minute, data-backed answer to coverage and audit questions."
- **KPI(s) influenced**: Time-to-triage for failing evidence; audit response time.
- **User journey position**: A refinement layer ON TOP OF the BK-45 evidence-chain view. The user must already be looking at an assembled chain before they can filter it — this Story has no value in isolation.

### Technical context
- **Frontend**: No traceability view, chain renderer, or filter UI component exists in the codebase today (`business-feature-map.md` §1 Inventory Summary lists "Test Execution (Runs)", "Defect Management", "Reporting / ROI" all as "Not yet implemented"). There is no `app/(app)/.../traceability` route, no filter bar component, no date-range picker pattern established anywhere in the UI inventory (§5.2 UI Component Inventory has zero filter/date-range components).
- **Backend**: No chain-assembly endpoint exists (confirmed by BK-45's refinement: no `GET /api/v1/user-stories/{id}/traceability` endpoint, no `tests`, `test_runs`, `run_results`, or `defects`/`bugs` tables in any of the 20 reviewed migrations). A filter endpoint would need to extend a chain-assembly endpoint that itself does not exist yet.
- **External services**: None identified for this Story specifically.
- **Integration points specific to this Story**: Direct, hard dependency on BK-45 (chain assembly) as the data source being filtered, and transitively on BK-24 (Tests), BK-30 (Manual Execution & Runs), BK-31 (Bugs & Defect Heatmap) — none of which exist yet (all "Planificación" per `epic.md` and BK-45's refinement §1.2).

### Story complexity
| Axis | Rating | Why |
|------|--------|-----|
| Business logic | Medium | Filter predicate logic (verdict equality, module scoping, date-range bounds, combination/AND semantics) is moderate once the chain exists — but is currently un-buildable. |
| Integration | High | Filters a 5-entity chain assembled across capabilities that don't exist; query must push filters down efficiently once the join is built (see BK-45 N+1 risk, inherited here). |
| Data validation | Medium | Date-range boundary handling (inclusive/exclusive, timezone), verdict enum validation, module scoping against the module tree. |
| UI | Medium | New filter bar component, active-filter chips/summary, empty-state-with-filters-stated UI — none of these patterns exist in the current component inventory. |

**Estimated test effort**: Cannot be reliably estimated yet — full ATP (in-sprint, parametrized) is blocked until BK-45 ships a stable, queryable chain data contract. Pre-sprint estimate: Medium-High once unblocked (driven mainly by the AND/OR filter-combination matrix and date-range boundary cases).

### Epic-level inheritance (if applicable)
- Risks restated at Story level: the Epic (`epic.md`) explicitly states *"this is a read-side capstone over the test-execution layer. It depends on the Tests, Manual Runs and Bugs capabilities being in place, and is scheduled to be implemented once those land."* BK-48 inherits this sequencing constraint directly — it is itself a read-side refinement ON TOP OF the capstone (BK-45), making it second-order dependent on the same unbuilt capabilities.
- Integration points inherited: US → AC → ATC → Test → Run → Defect chain (defined in BK-45's refinement §1.1) is the dataset BK-48 filters. BK-48 does not introduce new entities, only new query predicates over BK-45's output.
- PO/Dev answers already given at epic level: none yet — BK-45 itself has 7 open PO questions and 4 open Dev questions still unanswered (see BK-45's `shift-left-refinement.md` §6), several of which (verdict semantics at the Run layer, "latest run" definition, defect status visibility) are prerequisites for BK-48's "filter by verdict" AC to even be well-defined.
- Test strategy inherited: BK-45's refinement recommends not assigning SP "until upstream dependencies are confirmed for the same sprint" — the same caution applies here, one layer further removed.
- Unique considerations not covered at epic level: filter-combination semantics (AND vs OR across verdict + module + date), date-range UX (calendar picker vs free text), and "empty result with active filters clearly stated" copy/UI are specific to BK-48 and not addressed anywhere in BK-45's refinement.

---

## Phase 2 — Story Quality Analysis

### Ambiguities
| # | Location in Story | Question for PO/Dev | Impact on testing | Suggested clarification |
|---|-------------------|---------------------|-------------------|--------------------------|
| 1 | AC1: "filters the chain by result 'failed'" | Does "result" mean the Run's verdict only, or can it also mean a Test's aggregate verdict / an ATC's last-known status? The codebase already overloads "status" at the ATC level (`pass\|fail\|blocked\|skipped\|running\|unrun` per `business-feature-map.md` §2.8) — is "failed" filtering against that same enum, a separate Run-level enum, or both? | Cannot write the filter predicate or test data without knowing which entity's status field is the filter target. | Confirm: filter targets the Run's verdict field (once BK-30 defines it) — not the ATC `status` field. |
| 2 | AC1: "shows only the criteria, tests and runs that ended in a failure" | Does filtering propagate UPWARD (only show an AC/Test row if at least one of its descendant Runs failed) or does it filter ONLY the Run rows and leave parent AC/Test rows visible regardless? The phrase "criteria, tests and runs" suggests all three layers get pruned, but it's not explicit whether a passing Test under a failing AC still shows. | Determines whether the filter is a per-row filter or a tree-pruning filter — fundamentally different rendering logic and test design. | Clarify with an example: "AC-1 has Test-A (passed) and Test-B (failed). When filtering by 'failed', does AC-1 still render with only Test-B visible, or does AC-1 disappear because not ALL its tests failed?" |
| 3 | AC2: "filters by a module and a date range" | Is this AND logic (module AND date range both apply) or can the user apply module OR date range independently? Also: is "module" the Bunkai module-tree node that anchors the User Story (`modules` table), or some other module concept introduced by BK-30/BK-31 runs? | Cannot design the filter-combination test matrix or know if module-only / date-only partial filters are valid states. | Confirm AND semantics explicitly (per `refinement-questions.md` S7) and confirm "module" = the existing `modules` hierarchical entity already in production. |
| 4 | AC2: "a date range" | Date range on WHICH timestamp — Run's `executed_at`, Defect's `created_at`, or the AC/Test's own dates? Different layers have different natural dates; the Epic spans 5 entity types. | Determines which column the range query filters on, and whether different chain layers can disagree (e.g. a Run inside the date range but its linked Defect outside it). | Specify: date range filters on Run `executed_at` (the most natural "when did the evidence happen" anchor) unless PO intends otherwise. |
| 5 | AC3: "the active filters clearly stated" | No exact copy, layout, or component specified for how active filters are displayed (chips? a filter summary bar? a sentence?). Same vagueness pattern flagged in BK-45's refinement (V1-V4) for "clearly states" / "in one read." | Assertion text/selector cannot be written without a `data-testid` or exact copy. | Provide either exact copy (e.g. "No evidence found for: Module = Payments, Result = Failed, Date = Jun 1–15") or a stable `data-testid` per active-filter chip. |

### Gaps (missing info)
| # | Type | Why critical | What to add | Risk if omitted |
|---|------|---------------|--------------|-------------------|
| 1 | AC | No AC defines filter persistence — does the filter state survive a page reload, navigation away and back, or is it session/URL-param based? | Add AC specifying filter state is encoded in URL query params (shareable/bookmarkable) or reset on navigation. | QA cannot write a deterministic "share this filtered view" or "back-button" test without knowing the persistence contract. |
| 2 | AC | No AC defines filter-clearing / reset behavior. | Add AC: "Reset filters" control returns to the full unfiltered chain. | Users get stuck in a filtered state with no visible way out — common UX defect. |
| 3 | Technical detail | No AC addresses what happens to the filter UI itself when the underlying chain has zero data at all (BK-45's "no coverage" empty state) versus the filter producing zero matches from existing data (BK-48's own AC3). These are two different empty states that could be visually confused. | Add AC or note distinguishing "no evidence exists at all" (BK-45 concern) from "evidence exists but the filter excluded it all" (BK-48's AC3). | QA cannot assert the correct empty-state variant; a defect could go unnoticed if both states render identically. |
| 4 | Business rule | Module filter scope is undefined relative to the module tree's nesting (max depth 6, confirmed in `business-feature-map.md` §2.5). Does filtering by a parent module include evidence from its descendant sub-modules, or exact-match only? | Add AC clarifying whether module filter is tree-scoped (parent + descendants) or single-node exact match. | A QA Lead filtering by "Payments" expecting to also see "Payments/Refunds" evidence would get a false-negative empty result if the filter is exact-match only — directly undermines the Story's stated goal of "focus on what failed, where." |

### Edge cases not in Story
| # | Scenario | Expected behavior (best guess) | Criticality | Action |
|---|----------|----------------------------------|--------------|--------|
| 1 | User applies a date range where `from` is after `to` (inverted range) | UI rejects the input or auto-swaps the values with a validation message | Medium | Add to AC (NEEDS PO/DEV CONFIRMATION) |
| 2 | User filters by a module that has been soft-archived (module archive cascade exists per `business-feature-map.md` §2.5) | Archived module either does not appear in the module-filter picker, or if selected directly via URL param, returns the AC3 empty-result state | High | NEEDS PO/DEV CONFIRMATION |
| 3 | Date range boundary — Run executed exactly at the `from` or `to` timestamp (inclusive vs exclusive edge) | Range is inclusive on both ends | Medium | Add to AC (NEEDS PO/DEV CONFIRMATION) |
| 4 | Verdict filter value that doesn't exist yet in any Run (e.g. filtering by "blocked" when only "pass"/"fail" runs exist in the dataset) | Resolves to the AC3 empty-result state, not an error | Low | Test only — don't add AC |
| 5 | Filtering combination (module + date range + verdict) that is internally valid but the user's role cannot see some of the underlying chain data (cross-workspace / RLS boundary — same concern BK-45 flagged as EC2/EC6 CRITICAL) | Filtered results are still scoped to the caller's workspace; RLS enforcement happens before filtering, not after | High | NEEDS PO/DEV CONFIRMATION — security-relevant, inherits BK-45's CRITICAL tenant-isolation concern |

### Contradictions
No contradictions found between the Story description, the 3 ACs, and the (empty) comments. The Story description and ACs are internally consistent in intent; the ambiguities above are gaps in specificity, not actual disagreements between sections.

### Testability validation
**Verdict**: No

Issues:
- Vague AC: AC3's "clearly stated" has no exact copy or component anchor (same pattern as BK-45's flagged V1-V4 vagueness).
- Missing error messages: no AC defines copy for the inverted-date-range case or any filter-input validation error.
- No test-data examples: none of the 3 ACs specify concrete module names, dates, or verdict values — all use generic placeholders ("a module", "a date range").
- Missing performance criteria: no AC addresses filter response time, despite this being a query over what will eventually be a multi-entity join (inheriting BK-45's N+1 query risk at the assembly layer, now compounded by filter predicates).
- **Cannot isolate**: this is the dominant testability blocker — the Story cannot be executed or tested at all today because its dependency (BK-45's chain) has no implementation, and BK-45 itself depends on BK-24/BK-30/BK-31, none of which exist. See `## Data feasibility flags` below.

---

## Phase 3 — Refined Acceptance Criteria

### Original AC1 — Filter the chain to failures only

#### Scenario 1.1: Should show only failed criteria, tests and runs when filtering by result "failed" (Type: Positive, Priority: High)
- **Given**: a user story with a mix of passing and failing runs across its chain (e.g. AC-1 → Test-A → Run "pass"; AC-2 → Test-B → Run "fail")
- **When**: the Senior QA Engineer applies the result filter with value `"failed"`
- **Then**: the chain shows only AC-2 / Test-B / its failing Run (and any linked defect); AC-1 / Test-A are hidden or excluded from the rendered chain
  - UI: only failure-verdict rows visible; active filter indicator shows "Result: Failed"
  - API: filtered query returns only chain segments with Run verdict = `fail`
  - DB: read-only — no state change
  - System state: unaffected (filter is presentation-only, not a mutation)

**NEEDS PO/DEV CONFIRMATION** — whether filtering prunes the tree (hides whole AC/Test branches with no failing descendant) or filters Run rows only while keeping parent rows visible (see Phase 2 Ambiguity #2).

#### Scenario 1.2: Should leave passing branches visible when not all of a story's tests failed under the same AC (Type: Edge, Priority: Medium)
- **NEEDS PO/DEV CONFIRMATION**: behavior inferred — confirm before sprint planning
- **Given**: AC-1 has Test-A (passed) and Test-B (failed)
- **When**: the Senior QA Engineer filters by result "failed"
- **Then**: TBD pending Ambiguity #2 resolution — either AC-1 disappears entirely, or AC-1 renders showing only Test-B

### Original AC2 — Filter by module and date range

#### Scenario 2.1: Should show only evidence for a given module within a given date range (Type: Positive, Priority: High)
- **Given**: evidence spanning multiple modules (e.g. `Payments`, `Auth/Login`) and multiple dates (e.g. Run executed_at values across several days)
- **When**: the Senior QA Engineer filters by module `"Payments"` and date range `2026-06-01` to `2026-06-15`
- **Then**: the chain shows only evidence belonging to the `Payments` module with Run `executed_at` between `2026-06-01T00:00:00` and `2026-06-15T23:59:59` inclusive
  - UI: only matching module's chain segments visible; active filter shows "Module: Payments, Date: Jun 1–15"
  - API: filtered query scoped by `module_id` (or module path prefix — pending Phase 2 Gap #4) AND `executed_at` range
  - DB: read-only
  - System state: unaffected

**NEEDS PO/DEV CONFIRMATION** — whether the module filter is exact-match on the selected module node or tree-scoped to include descendant sub-modules (Phase 2 Gap #4).

#### Scenario 2.2: Should apply module and date filters as AND logic, not OR (Type: Positive, Priority: Medium)
- **NEEDS PO/DEV CONFIRMATION**: behavior inferred — confirm before sprint planning
- **Given**: evidence exists for module `Payments` outside the date range, AND evidence exists for module `Auth` inside the date range
- **When**: the Senior QA Engineer filters by module `Payments` AND date range covering only the `Auth` evidence's dates
- **Then**: zero results are returned (neither the out-of-range `Payments` evidence nor the wrong-module `Auth` evidence qualifies) — confirms AND, not OR, combination semantics

### Original AC3 — Filter with no matches

#### Scenario 3.1: Should show an empty result with active filters clearly stated when a filter combination matches no evidence (Type: Negative, Priority: High)
- **Given**: a filter combination (e.g. module `"NonexistentModule"` and/or a date range with zero evidence) that matches no chain rows
- **When**: the Senior QA Engineer applies that filter combination
- **Then**: the view shows an empty result, and the currently active filter values are displayed in a way distinct from BK-45's "no coverage exists at all" empty state
  - UI: empty-state message + visible filter summary (exact copy TBD — Phase 2 Ambiguity #5)
  - API: 200 with an empty result set (not an error)
  - DB: read-only
  - System state: unaffected

### New scenarios surfaced from Phase 2 edge cases — NEEDS PO/DEV CONFIRMATION

#### Scenario E1: Should reject or auto-correct an inverted date range (from-date after to-date) (Type: Negative, Priority: Medium)
- **NEEDS PO/DEV CONFIRMATION**: behavior inferred — confirm before sprint planning
- **Given**: the Senior QA Engineer enters a `from` date later than the `to` date
- **When**: the filter is applied
- **Then**: TBD — either a validation error blocks the apply action, or the values are auto-swapped

#### Scenario E2: Should resolve to the empty-result state when filtering by an archived module (Type: Edge, Priority: High)
- **NEEDS PO/DEV CONFIRMATION**: behavior inferred — confirm before sprint planning
- **Given**: a module that has been soft-archived (cascade-archived per existing `bunkai_archive_module_subtree` behavior)
- **When**: that module is selected as a filter (if still selectable) or passed via URL param
- **Then**: TBD — either excluded from the module picker entirely, or resolves to AC3's empty-result state

---

## Phase 4 — Test Outlines (DRAFT — outline names only)

### Coverage estimate
| Type | Count | Notes |
|------|-------|-------|
| Positive | 4 | Happy-path filter-by-verdict, filter-by-module+date, AND-combination, multi-page/large-chain filter result |
| Negative | 4 | Inverted date range, filter with no matches, cross-workspace scoping under filter, invalid verdict value |
| Boundary | 3 | Date-range inclusive edges, archived-module filter, empty module-tree filter |
| Integration | 2 | Filter predicate pushed down into the (future) chain-assembly query; filter state round-trips via URL params |
| API | 0 | No filter-specific endpoint contract exists yet to enumerate against — deferred until BK-45's chain endpoint is designed |
| **Total** | **13** | |

**Rationale**: The count stays deliberately modest because this Story is a refinement layer over an unbuilt chain — most genuine complexity (the filter-combination matrix, performance under a large dataset, exact "latest verdict" semantics) cannot be enumerated in detail until BK-45's data contract and BK-30's Run/verdict model exist. The 13 outlines capture what is testable in principle today: filter logic shape, empty-state distinctness, and the two explicit AND/boundary risks surfaced in Phase 2.

### Outline list (NAMES ONLY — preconditions in 1 line, expected in 1 line)

#### Positive
- **Should filter chain to failed-only evidence when result filter is "failed"** — Pre: chain with mixed pass/fail Runs. Expected: only failing branches/rows visible.
- **Should filter chain to a single module and date range combination** — Pre: evidence across multiple modules and dates. Expected: only matching module + in-range evidence visible.
- **Should apply module and date filters as AND, not OR** — Pre: evidence matching module-only and date-only separately, none matching both. Expected: zero results returned.
- **Should render filtered results correctly for a large chain (boundary-adjacent volume)** — Pre: a story with many ACs/ATCs/Runs, filter narrows to a small subset. Expected: only matching subset renders, no truncation errors.

#### Negative
- **Should display empty result with active filters clearly stated when filter combination matches no evidence** — Pre: filter combination with zero matching evidence. Expected: empty-state UI + visible filter summary, distinct from BK-45's "no coverage at all" state.
- **Should reject or auto-correct an inverted date range** — Pre: from-date later than to-date entered. Expected: validation error or auto-swap (NEEDS PO/DEV CONFIRMATION on which).
- **Should not leak cross-workspace evidence through filter params** — Pre: filter params (module ID, date range) crafted to reference another workspace's data. Expected: results remain scoped to caller's workspace; no leak (inherits BK-45 CRITICAL tenant-isolation concern).
- **Should resolve to empty-result state, not an error, when filtering by a verdict value with zero matching runs** — Pre: filter by a valid verdict enum value absent from the dataset. Expected: AC3 empty-result state, HTTP 200, not 4xx/5xx.

#### Boundary
- **Should include evidence exactly at the date-range inclusive boundary (from and to timestamps)** — Pre: a Run executed exactly at the `from` or `to` boundary instant. Expected: included in results (NEEDS PO/DEV CONFIRMATION on inclusive vs exclusive).
- **Should resolve to empty-result state when filtering by a soft-archived module** — Pre: an archived module selected or passed via URL param. Expected: empty-result state, not an error or stale data (NEEDS PO/DEV CONFIRMATION).
- **Should handle filter applied when the underlying chain itself has zero evidence (distinct from filter producing zero matches)** — Pre: a story with no ATCs/Tests/Runs at all (BK-45's "no coverage" state) plus any filter applied. Expected: BK-45's "no coverage" empty state takes precedence and is visually distinct from BK-48's "filter matched nothing" empty state.

#### Integration
- **Should push filter predicates down into the chain-assembly query rather than filtering client-side post-fetch** — Pre: chain-assembly endpoint (from BK-45) exists and accepts filter query params. Expected: filtered query returns only matching rows from the DB, not the full chain filtered in the browser (performance concern inherited from BK-45's N+1 risk).
- **Should persist and round-trip filter state via URL query params** — Pre: filters applied, page URL updated. Expected: reloading or sharing the URL reproduces the same filtered view (NEEDS PO/DEV CONFIRMATION — persistence contract is currently undefined, Phase 2 Gap #1).

> **NOT included here** (deferred to in-sprint planning by `/sprint-testing` Stage 1): parametrization tables, per-outline test-data JSON, numbered test steps, Faker generation strategies. Coverage estimate IS included because PO uses it for estimation.

---

## Phase 5 — Edge Cases (DRAFT)

| # | Edge case | In original Story? | Criticality | Action |
|---|-----------|----------------------|---------------|--------|
| 1 | Inverted date range (from after to) | No | Medium | Add to AC (PO confirm) |
| 2 | Filtering by a soft-archived module | No | High | Add to AC (PO confirm) |
| 3 | Date-range inclusive/exclusive boundary | No | Medium | Add to AC (PO confirm) |
| 4 | Verdict filter value with zero matching runs (vs. an invalid/unsupported verdict value) | No | Low | Test only — don't add AC |
| 5 | Cross-workspace data exposure through crafted filter params | No | High | Add to AC (PO confirm) — security-relevant |
| 6 | Filter applied on a chain with zero underlying evidence (BK-45 "no coverage") vs. filter matching zero evidence (BK-48 AC3) — distinguishing the two empty states | No | Medium | Add to AC (PO confirm) |
| 7 | Filter state persistence across reload / navigation / share | No | Medium | Add to AC (PO confirm) |

> Test-data generation strategy + Faker recipes are NOT defined here. They land in `/sprint-testing` Stage 1 when the feature exists.

---

## Story Quality Assessment

**Verdict**: Significant Issues

**Key findings** (1-3 bullets):
- The Story's 3 ACs are clear in intent but written entirely in generic terms ("a module," "a date range," "the active filters clearly stated") with no concrete values, no filter-combination semantics (AND/OR), and no tree-pruning-vs-row-filtering behavior defined — this is a normal and acceptable level of detail for a pre-sprint Story, but it leaves several testing-blocking ambiguities that must be resolved before estimation.
- The dominant issue is not ambiguity in the AC text itself but **complete non-existence of the feature being filtered**: BK-48 filters a chain (BK-45) that has no implementation, over entity types (Tests/BK-24, Runs/BK-30, Defects/BK-31) that have no schema. This is a second-order dependency risk on top of BK-45's already-flagged first-order risk.
- Testability verdict is "No" purely due to the data/feature feasibility gap, not due to AC quality — once BK-45 ships a stable chain contract, most of the ambiguities here (AND logic, date-range anchor, module tree-scoping) become quick, low-risk PO answers.

---

## Critical Questions for PO

> These BLOCK sprint planning until answered.

1. **Does the result filter prune entire AC/Test branches with no failing descendant, or only filter the Run-level rows while keeping parent AC/Test rows visible?**
   - **Context**: AC1 says "the chain shows only the criteria, tests and runs that ended in a failure," which reads as tree-pruning, but is not explicit about partially-failing branches (an AC with one passing Test and one failing Test).
   - **Impact if unanswered**: Cannot design the filter rendering logic or the assertion strategy for the most common real-world case (mixed-result stories).
   - **Suggested answer (if you have one)**: Tree-prune at the leaf (Run) level; show an AC/Test branch if and only if at least one descendant Run matches the filter — this preserves traceability context while still satisfying "focus on what failed."

2. **Are module + date-range filters combined with AND or OR logic, and is the module filter exact-match on the selected node or tree-scoped to include sub-modules?**
   - **Context**: AC2 implies both filters apply together but doesn't state the combination operator; the module tree (max depth 6) makes tree-scoping a real and likely-expected behavior, not an edge case.
   - **Impact if unanswered**: Both the filter-combination test matrix (Scenario 2.2) and the module-scoping test (Phase 2 Gap #4) cannot be written; a QA Lead filtering by a parent module may get a false-negative empty result.
   - **Suggested answer (if you have one)**: AND logic; module filter tree-scoped (parent + all active descendants), matching how the module tree is already navigated elsewhere in the product.

3. **Should this Story remain in the current sprint-readiness pipeline given that its data source (BK-45's chain) and BK-45's own upstream dependencies (BK-24 Tests, BK-30 Runs, BK-31 Defects) are all still in "Planificación" with no schema?**
   - **Context**: BK-48 is a filter layer ON TOP OF BK-45, which itself cannot be completed until BK-24/BK-30/BK-31 land. BK-48 is therefore third-order dependent on three unbuilt epics.
   - **Impact if unanswered**: Estimating or scheduling BK-48 before BK-45 (and its own dependencies) ship risks committing sprint capacity to a Story that has nothing to filter.
   - **Suggested answer (if you have one)**: Sequence BK-48 strictly after BK-45 reaches at least "Ready For Dev" with a stable, documented chain data contract; do not estimate BK-48's SP until that contract exists.

---

## Technical Questions for Dev

> These do not block PO but block implementation.

1. **Will filter predicates be pushed down into the (future) chain-assembly query, or applied client-side after fetching the full unfiltered chain?** — Context: BK-45's refinement already flags an N+1 / large-chain performance risk at the assembly layer (EC6); adding filter logic without server-side predicate push-down compounds that risk for any story with a large ATC/Run count. Testing impact: determines whether performance/boundary outlines test the API layer or only the UI rendering layer.

2. **What is the persistence mechanism for filter state — URL query params, local component state, or server-side saved view?** — Context: no AC addresses this; Phase 2 Gap #1. Testing impact: determines whether "share this filtered view" / browser-back-button test outlines are in scope at all.

3. **Which timestamp column does the date-range filter target — Run `executed_at`, or some other per-layer timestamp — and is the range inclusive or exclusive at the boundaries?** — Context: Phase 2 Ambiguity #4 and Phase 5 Edge Case #3. Testing impact: boundary test outline (Phase 4) cannot be finalized without this.

---

## Suggested Story Improvements

| # | Current state | Suggested change | Benefit |
|---|----------------|----------------------|------------|
| 1 | "filters the chain by result 'failed'" | "filters the chain so that any AC/Test branch with at least one Run matching the selected verdict remains visible, with non-matching Run rows hidden" | Removes the tree-pruning-vs-row-filtering ambiguity (Critical Q1) and makes the behavior testable without inference. |
| 2 | "filters by a module and a date range" | "filters by module (tree-scoped to include active sub-modules) AND a date range (inclusive on Run `executed_at`), both conditions combined with AND" | Removes Critical Q2 ambiguity; gives QA a concrete predicate to test against. |
| 3 | "the view shows an empty result with the active filters clearly stated" | "the view shows an empty-state message including the human-readable summary of every active filter (e.g. 'Module: Payments, Result: Failed, Date: Jun 1–15') via `data-testid=\"active-filters-summary\"`" | Makes the empty-state assertion deterministic instead of relying on prose interpretation (same fix pattern BK-45 needed for "clearly states"). |
| 4 | No AC on filter reset/clear behavior | Add AC: "A visible 'Clear filters' control returns the view to the full unfiltered chain" | Closes Gap #2 — prevents users getting stuck in a filtered dead-end. |

---

## Data feasibility flags

**DATA-FEASIBILITY-RISK: confirmed and concrete.**

BK-48 filters "the chain" — the assembled evidence chain (User Story → Acceptance Criterion → ATC → Test → Run → Defect) that BK-45 ("Render full US to bug evidence chain in one read") is responsible for producing. BK-45 is currently in status **Estimation** (per the orchestrator's known facts) / **Shift-Left QA** (per the synced `story.md` read during this session — status may have moved between the two pre-sprint stages; either way it is NOT in development or done). Concretely, this means:

- **Entity / fixture missing**: There is no queryable, filterable data structure to apply BK-48's filters against. BK-45's own refinement (`shift-left-refinement.md` §1.2–1.3) confirms zero implementation of `tests`, `test_runs`/`run_results`, or `defects`/`bugs` tables across all 20 reviewed migrations, and no `GET /api/v1/user-stories/{id}/traceability` endpoint exists. BK-48 has nothing to filter — not "limited data," literally no chain-assembly capability at all.
- **API contract gap**: A filter capability implies query parameters (verdict, module_id, date range) on a chain-assembly endpoint. That endpoint does not exist; its contract (response shape, pagination, sort/latest-run semantics) is still under PO/Dev negotiation in BK-45's own open questions (BK-45 §6, items 1–4). BK-48 cannot define its filter contract until BK-45's base contract is settled — defining filter params against an undefined response shape risks rework.
- **Required pre-work**: BK-45 must reach at least a stable, documented chain-assembly contract (ideally "Ready For Dev" or further) before BK-48 can be implemented or meaningfully estimated. Additionally, BK-48's AC1 (filter by verdict) depends on BK-30 (Manual Execution & Runs) defining the Run verdict model, and AC2's module-scoping question depends on no new work (the `modules` entity is Active in production) but still needs the chain-assembly join to expose `module_id` per chain row.

**Second dependency gap — BK-30**: BK-48 also implicitly depends on BK-30 (Manual Execution & Runs, status Planificación per the Story's traceability section) for the Run verdict and Run `executed_at` timestamp that AC1 (verdict filter) and AC2 (date-range filter) both filter on. This is the same upstream dependency BK-45 already flagged as a CRITICAL blocker (BK-45 §1.2, §7 Main Risk Areas) — BK-48 inherits it without adding a new blocker, but it reinforces that BK-48 cannot be implemented in isolation from BK-30 either.

**Sequencing risk**: BK-48 should NOT enter sprint planning or receive an SP estimate ahead of BK-45. Recommend the PO treat BK-48 as sequenced strictly after BK-45 reaches "Ready For Dev" with a documented response contract, and after BK-30 has at least a defined Run verdict + timestamp schema. Estimating BK-48 today would commit sprint capacity against a moving target.

---

## Recommended testing strategy

### Pre-implementation
- Do not write parametrized test-data or numbered test steps yet — defer to in-sprint planning once BK-45's chain contract and BK-30's Run schema are stable (per `acceptance-test-planning.md` §0.3 Data feasibility check).
- Track BK-45 and BK-30's status; re-run this refinement's Phase 0.3-equivalent validation once either status changes, since the refined ACs here assume a specific (currently undefined) chain row shape.
- Resolve the 3 Critical PO Questions and the verdict/timestamp Dev questions before any SP estimation session.

### During implementation
- Verify filter predicates are pushed server-side (Tech Q1) early — this is the highest-leverage architectural decision affecting every later performance and boundary test.
- Validate tenant-isolation (RLS) is enforced BEFORE filter predicates apply, not after — inherits BK-45's CRITICAL cross-workspace concern; a filter that "helpfully" widens scope to bypass RLS would be a severe security regression.

### Post-implementation (in-sprint by /sprint-testing)
- Expand the 13 DRAFT outlines into full parametrized test cases with concrete module names, dates, and verdict values once BK-45's actual response shape is known.
- Add the deferred edge cases (Phase 5) as formal ACs or test-only cases per PO's confirmation.
- Re-validate AND-combination semantics and module tree-scoping against the real implementation, since both were inferred (NEEDS PO/DEV CONFIRMATION) here.

---

## Risks & mitigation

| # | Risk | Likelihood | Impact | Mitigated by which outlines |
|---|------|-----------|--------|------------------------------------|
| 1 | BK-48 estimated/scheduled before BK-45 + BK-30 ship, committing sprint capacity to an unbuildable Story | High | High | N/A — mitigated by sequencing recommendation in `## Data feasibility flags`, not by a test outline |
| 2 | Filter implemented as tree-pruning when PO intended row-only filtering (or vice versa), causing rework | Medium | Medium | Outline "Should filter chain to failed-only evidence..." + Scenario 1.2 |
| 3 | Cross-workspace data exposure via crafted filter query params (module_id / date range referencing another workspace) | Low | Critical | Outline "Should not leak cross-workspace evidence through filter params" |
| 4 | Two distinct empty states (BK-45 "no coverage" vs BK-48 "filter matched nothing") rendered identically, confusing users into thinking a feature is broken when it's just over-filtered | Medium | Medium | Outline "Should handle filter applied when the underlying chain itself has zero evidence" |
| 5 | Module filter implemented as exact-match when users expect tree-scoping (or vice versa), producing false-negative empty results | Medium | Medium | Outline "Should filter chain to a single module and date range combination" + Critical Question 2 |

---

## Next steps

- [ ] PO answers Critical Questions before sprint planning
- [ ] Dev answers Technical Questions before estimation
- [ ] Story enters sprint at status Ready For Dev once estimated
- [ ] When Story reaches Ready For QA, `/sprint-testing` will short-circuit refinement (label `shift-left-reviewed` detected)
- [ ] **BLOCKER**: Do not estimate or schedule BK-48 ahead of BK-45 reaching a stable chain-assembly contract and BK-30 defining its Run verdict/timestamp schema

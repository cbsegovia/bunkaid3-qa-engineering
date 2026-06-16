# Shift-Left Refinement — BK-35
**Story:** TMS-Run Execution | Mark each step pass, fail, or block
**Epic:** BK-30 — Manual Execution & Runs
**Refined on:** 2026-06-08
**Risk level:** HIGH
**TMS modality:** jira-native
**Status:** Refined — Awaiting PO Estimation

---

## 1. Critical Analysis

### 1.1 Scope summary

BK-35 is the step-result recording layer for a manual test run. Once BK-34 (start a run) creates the Run entity with every step in `pending` state, BK-35 provides the mechanism to transition individual step results to `passed`, `failed`, or `blocked`, attach optional notes and evidence links, and have those step-level results drive:

1. The **parent ATC verdict** (derived field — aggregation over all step results in the ATC).
2. The **overall run progress percentage** (count of resolved steps / total steps).
3. **Real-time push** of both computed values to concurrent observers watching the same Run page.

The guard rail at the bottom is explicit: attempting to record a result against a Run that is already `finished` or `aborted` must be rejected with a clear message.

The DoD also implies a last-write-wins rule for repeated submissions on the same step ("the latest reported result for a step is the one shown").

### 1.2 Dependencies (upstream / downstream)

| Direction | Story | Key contract BK-35 inherits or exports |
|---|---|---|
| **Upstream (hard)** | BK-34 — Start a manual run | Run entity + step snapshot + `pending` initialization must exist before BK-35 can record anything. No Run = no step result. |
| **Upstream (soft)** | BK-27 — Assemble a test by chaining ATCs | Defines the step order and executable step content that BK-34 snapshots. BK-35 relies on the snapshotted steps, NOT live ATC definitions. |
| **Downstream (hard)** | BK-39 — Finish a run with a final verdict | BK-39's "finish" trigger presumably fires when all steps in the Run are resolved; it depends on BK-35's state machine being stable. |
| **Downstream (soft)** | BK-36 — Abort a run | The "run already finished or aborted" guard in BK-35 AC7 will need to read the run status written by BK-36. |
| **Downstream (soft)** | BK-38 — Run reporting totals | Totals are driven by the same verdicts and progress percentages BK-35 computes. |
| **Downstream (soft)** | BK-40 — File a defect from a failing step | BK-40 is linked directly in the traceability of BK-35 and reads step results. |

### 1.3 Feasibility notes (from data model — no backend yet)

The business data map and feature map confirm **no `test_runs`, `run_steps`, or `run_results` tables exist in the current 20 migrations**. BK-35 cannot be implemented or fully tested until BK-34's data model is merged. Key data model questions that determine testability:

- What is the primary key / identifier for an individual run step? (needed to call the mark-step endpoint)
- Is the ATC verdict a computed/derived column, a materialized field updated by trigger, or an application-layer calculation?
- Is the progress percentage a DB column or computed at read time?
- What field and table stores the "run status" (`finished` / `aborted`) that BK-35's guard reads?
- What is the real-time transport mechanism? (Supabase Realtime subscriptions, SSE, polling?) — the AC says "live without refreshing" but the tech choice is undefined.
- Is the evidence link a plain URL string or a file attachment pointing to a Supabase storage object?

The ATC status field already documents `pass | fail | blocked | skipped | running | unrun` on the ATC **library** entity, but run-level step results are a separate concern. This must not be confused with the ATC library status.

---

## 2. Story Quality Analysis

### 2.1 Ambiguities found

| # | Location in Story | Question for PO/Dev | Impact on testing | Suggested clarification |
|---|---|---|---|---|
| A1 | DoD item 3: "parent ATC verdict updates from step results" | Which entity is "parent ATC"? Is it the ATC library record, or a run-scoped ATC wrapper? Updating the ATC library record with a run verdict would corrupt the library. | Cannot design assertion — different tables, different endpoints | Specify that verdict is on a run-scoped ATC result record, not on the `atcs` library table |
| A2 | DoD item 3: "blocked when any is blocked and none failed" | Does a mix of `blocked` + `pending` steps (i.e., not all resolved) produce a `blocked` ATC verdict, or does the verdict stay unresolved until all steps are resolved? | 4 of the 8 step-state combination outcomes are ambiguous | Define minimum resolution threshold: does verdict compute only when 0 steps remain `pending`? |
| A3 | DoD item 5: "sees the verdict and progress update live without refreshing" | What is the real-time mechanism? Supabase Realtime, SSE, WebSocket, polling interval? The difference is critical for test design. | Cannot write integration test without knowing the transport | Dev to specify transport; QA needs to know if test uses channel subscription or network request polling |
| A4 | DoD item 2: "an evidence link can be attached" | Is this a free-form URL string, a file upload (binary), or a reference to a Supabase storage object? | Data model for the assertion (URL validation, file size limits, content type) differs completely | Clarify: URL string input vs. file upload vs. Supabase storage |
| A5 | DoD item 7: "the latest reported result for a step is the one shown" | Does marking a step a second time UPDATE the existing step result row, or INSERT a new row (append log) with the latest one surfaced? | Affects uniqueness constraints, audit history, and rollback behavior | Define whether step result is mutable (UPDATE) or append-only (INSERT latest visible) |
| A6 | DoD item 6: "reporting a result on a Run that has already finished or been aborted is blocked with a clear message" | What is the exact message text for "finished" vs "aborted"? Are they the same message or differentiated? | Assertion on error message text will fail if the message is wrong or varies | PO to define the exact user-facing error message strings |
| A7 | DoD item 4: "overall run progress percentage advances" | Is progress based on (resolved steps / total steps) where `resolved = passed + failed + blocked`? Or is `blocked` excluded from the resolved count? | Boundary test for progress at 100% will differ | Confirm formula: numerator = steps where status ≠ pending; denominator = total steps |

### 2.2 Gaps (missing ACs / behaviors not described)

| # | Type | Why critical | What to add | Risk if omitted |
|---|---|---|---|---|
| G1 | AC / Guard | What happens when a `pending` step is skipped? The ATC library defines `skipped` as a valid status but BK-35 only exposes pass/fail/blocked. Is `skipped` reachable from the UI in a run? | Add AC or explicit out-of-scope statement for `skipped` | Ambiguous behavior leaves testers guessing; devs may or may not implement skip |
| G2 | AC / Validation | Note field max length is undefined. The AC says "optional note" but gives no character limit. | Add validation rule: max length for step note (suggest 1000 chars) | Dev implements without limit; future truncation breaks existing data |
| G3 | AC / Validation | Evidence link: no URL format validation or max-length described. | Add validation: valid URL scheme (https only?), max 2048 chars | Invalid URLs stored in DB; broken link displayed to user |
| G4 | AC / Authorization | Who can mark steps? Any workspace member with project access? Or only the Run's executor? | Add AC: role/ownership gate on who can record results | Non-executor members marking steps would corrupt run ownership semantics |
| G5 | AC / State | Can a step that was already `passed` be re-marked as `failed`? DoD item 7 implies yes (last-write-wins), but there is no AC explicitly covering re-marking. | Add AC: "Given a step is already marked passed/failed/blocked, When the user re-marks it with a different status, Then the step result updates to the new status" | Testers will not know whether re-marking is intentional or a bug |
| G6 | Technical | There is no defined endpoint for marking a step. Sprint-testing cannot design API-level tests without knowing `PATCH /api/v1/run-steps/{id}` or equivalent shape. | Dev to define the REST or RPC endpoint in the sprint planning session | Automation subagent cannot write API tests; integration test outline is unwritable |
| G7 | AC / State | What is the initial ATC verdict before any steps are resolved? `unrun`? `pending`? The story never states the initial value. | Add starting-state AC | Assertion in the first positive test will fail if initial verdict value is wrong |
| G8 | AC / Scope | Does BK-35 only apply to runs started by BK-34 (`in_progress` status), or also runs in other intermediate states? | Clarify which run statuses allow step marking | Guard behavior (AC DoD item 6) only names `finished` and `aborted`; what about `paused` if that status exists? |

### 2.3 Untestable or vague ACs

| # | AC / DoD item | Issue | Fix |
|---|---|---|---|
| V1 | DoD item 5: "sees the verdict and progress update live without refreshing" | "Live" is untestable without knowing the transport. A manual tester cannot verify Supabase Realtime subscription events without tooling. The AC needs a latency bound or a test-observable event (e.g., "within 3 seconds of the update"). | Add observable criterion: "The teammate's page reflects the update within N seconds (or on subscription event) without a page reload." |
| V2 | DoD item 6: "blocked with a clear message" | "Clear" is subjective. The message text is not specified. | PO to define the exact error message text for each guard case. |
| V3 | DoD item 4: "overall run progress percentage advances as steps are resolved" | No example value or formula. Is 1 of 4 steps = 25.0%? 25%? Rounded? | Define the formula and rounding rule. |

### 2.4 Edge cases not in the story

| # | Scenario | Expected behavior (best guess) | Criticality | Action |
|---|---|---|---|---|
| E1 | Two users mark the same step simultaneously (race condition) | Last write wins at DB level; one result persists, no error to either user | CRITICAL | **NEEDS PO/DEV CONFIRMATION** — concurrent writes to same step row |
| E2 | User marks step while network is lost mid-request | UI shows error; step remains in previous state; retry is safe | HIGH | **NEEDS PO/DEV CONFIRMATION** — idempotency of the mark-step call |
| E3 | Run with zero steps is somehow opened (BK-34 guard failed or data was manually corrupted) | Progress formula divide-by-zero guard; UI shows 0% or N/A | HIGH | **NEEDS PO/DEV CONFIRMATION** — zero-step run guard in BK-35's progress calc |
| E4 | All steps marked `blocked`, none `failed` → ATC verdict = `blocked` | Expected per DoD, but what if some remain `pending`? | HIGH | Covered in ambiguity A2 — needs PO answer before edge case is testable |
| E5 | All 8 step-state combinations for a 2-step ATC (full state matrix) | See table in Section 3 below | HIGH | Design test for each combination |
| E6 | Evidence link is a very long URL (>2048 chars) | Rejected with validation error, not stored | MEDIUM | **NEEDS PO/DEV CONFIRMATION** |
| E7 | Note field contains Markdown / HTML / script injection | Sanitized before storage (following existing pattern in description fields) | MEDIUM | **NEEDS PO/DEV CONFIRMATION** — confirm sanitization applies to step notes |
| E8 | Re-marking a step from `passed` back to `pending` | Is de-escalation to `pending` allowed? DoD item 7 implies last-write-wins for any status, but `pending` re-marking could break progress formula | HIGH | **NEEDS PO/DEV CONFIRMATION** |
| E9 | Run is aborted (BK-36) while a mark-step request is in-flight | Race: abort wins → 409/guard fires; or step wins → run is partially marked with aborted status | CRITICAL | **NEEDS PO/DEV CONFIRMATION** |
| E10 | Step note + evidence link are both empty strings (vs null/undefined) | Should be treated as "not provided" (same as null), not as invalid input | MEDIUM | **NEEDS PO/DEV CONFIRMATION** |

---

## 3. Refined Acceptance Criteria

### AC1 — Mark a pending step as passed, failed, or blocked

#### Scenario 1.1: Should mark a pending step as passed with optional note and evidence link (Positive, High)
- **Given**: An authenticated QA Engineer with project access is viewing an active (in-progress) Run
  - And the Run has at least one step in `pending` status
- **When**: The engineer marks step #1 as `passed`, with note `"Login redirects correctly"`, and evidence link `"https://s3.example.com/evidence/screenshot-001.png"`
- **Then**:
  - The step result for step #1 is recorded as `passed`
  - The note `"Login redirects correctly"` is stored on the step result
  - The evidence link `"https://s3.example.com/evidence/screenshot-001.png"` is stored on the step result
  - The UI reflects the step status as `passed` immediately
  - The run progress percentage increments (e.g., 1 of 4 steps resolved = 25%)

#### Scenario 1.2: Should mark a pending step as passed with no note or evidence (Positive, High)
- **Given**: An active Run with a step in `pending` status
- **When**: The engineer marks step #1 as `passed` without providing a note or evidence link
- **Then**:
  - The step result is recorded as `passed`
  - The note and evidence link fields are null/empty
  - No validation error is raised

#### Scenario 1.3: Should mark a pending step as failed (Positive, High)
- **Given**: An active Run with step #2 in `pending` status
- **When**: The engineer marks step #2 as `failed`
- **Then**:
  - The step result for step #2 is recorded as `failed`
  - The parent ATC verdict updates to `failed` (because any fail → ATC is failed)

#### Scenario 1.4: Should mark a pending step as blocked (Positive, High)
- **Given**: An active Run with all steps in `pending` status
- **When**: The engineer marks step #1 as `blocked`
- **Then**:
  - The step result for step #1 is recorded as `blocked`
  - The parent ATC verdict does NOT yet update to `blocked` if other steps are still `pending` **NEEDS PO/DEV CONFIRMATION**

---

### AC2 — ATC verdict derivation (8 step-state combinations for a 2-step ATC)

**State machine table (2-step ATC — exhaustive):**

| Step 1 | Step 2 | Expected ATC verdict | Confirmed? |
|---|---|---|---|
| passed | passed | `passed` | Per DoD |
| failed | failed | `failed` | Per DoD |
| blocked | blocked | `blocked` (if no fail) | Per DoD |
| failed | passed | `failed` | Per DoD |
| passed | failed | `failed` | Per DoD |
| blocked | passed | `blocked` (no fail) | Per DoD |
| passed | blocked | `blocked` (no fail) | Per DoD |
| failed | blocked | `failed` (fail overrides) | Per DoD |

**Unresolved combinations (pending steps present):**

| Step 1 | Step 2 | ATC verdict while unresolved? | Action |
|---|---|---|---|
| pending | pending | `unrun` or `pending`? | **NEEDS PO/DEV CONFIRMATION** |
| passed | pending | Partial — what value? | **NEEDS PO/DEV CONFIRMATION** |
| failed | pending | `failed` already, or wait? | **NEEDS PO/DEV CONFIRMATION** |
| blocked | pending | `blocked` already, or wait? | **NEEDS PO/DEV CONFIRMATION** |

#### Scenario 2.1: Should set ATC verdict to passed when all steps pass (Positive, Critical)
- **Given**: An active Run with an ATC containing 2 steps, both in `pending`
- **When**: The engineer marks step 1 as `passed` and then step 2 as `passed`
- **Then**: The ATC verdict transitions to `passed`

#### Scenario 2.2: Should set ATC verdict to failed when any step fails (Positive, Critical)
- **Given**: An active Run with an ATC containing 2 steps
- **When**: The engineer marks step 1 as `passed` and step 2 as `failed`
- **Then**: The ATC verdict is `failed` regardless of step 1's status

#### Scenario 2.3: Should set ATC verdict to blocked when any step is blocked and no step is failed (Positive, Critical)
- **Given**: An active Run with an ATC containing 2 steps
- **When**: The engineer marks step 1 as `blocked` and step 2 as `passed`
- **Then**: The ATC verdict is `blocked`

#### Scenario 2.4: Should set ATC verdict to failed when steps include both failed and blocked (Positive, Critical)
- **Given**: An active Run with an ATC containing 2 steps
- **When**: The engineer marks step 1 as `failed` and step 2 as `blocked`
- **Then**: The ATC verdict is `failed` (failed overrides blocked)

---

### AC3 — Run progress percentage

#### Scenario 3.1: Should advance run progress as steps are resolved (Positive, High)
- **Given**: An active Run with 4 steps, all in `pending`
- **When**: The engineer marks 1 step as `passed`
- **Then**: The run progress advances to 25% (1 resolved / 4 total)
- **When**: The engineer marks a second step as `failed`
- **Then**: The run progress advances to 50% (2 resolved / 4 total)

#### Scenario 3.2: Should reach 100% progress when all steps are resolved (Boundary, High)
- **Given**: An active Run with 2 steps
- **When**: Both steps are marked (any combination of pass/fail/blocked)
- **Then**: Run progress is 100%
  - **NEEDS PO/DEV CONFIRMATION**: Does 100% progress automatically trigger the "finish run" flow from BK-39, or does the engineer still manually finish the run?

---

### AC4 — Real-time update for concurrent observers

#### Scenario 4.1: Should reflect step result update live for a teammate watching the same Run (Positive, High)
- **Given**: User A is marking steps on an active Run; User B has the same Run page open in a different browser session
- **When**: User A marks step #1 as `passed`
- **Then**: User B's page reflects step #1 as `passed` and the updated progress percentage without a manual page refresh
  - **Observable criterion**: update is visible within a defined time window (transport-dependent) **NEEDS PO/DEV CONFIRMATION** — Dev to specify latency SLA and observable event for test verification

---

### AC5 — Guard: Run already finished or aborted

#### Scenario 5.1: Should reject step result recording on a finished Run (Negative, Critical)
- **Given**: A Run that has been marked as `finished` (by BK-39)
- **When**: The engineer attempts to mark any step on the finished Run
- **Then**:
  - The request is rejected
  - The user sees a clear message (exact text **NEEDS PO/DEV CONFIRMATION**)
  - The step result is NOT recorded
  - The run state remains unchanged

#### Scenario 5.2: Should reject step result recording on an aborted Run (Negative, Critical)
- **Given**: A Run that has been aborted (by BK-36)
- **When**: The engineer attempts to mark any step on the aborted Run
- **Then**:
  - The request is rejected
  - The user sees a clear message (exact text **NEEDS PO/DEV CONFIRMATION**)
  - The step result is NOT recorded

---

### AC6 — Last-write-wins for repeated step marking

#### Scenario 6.1: Should replace a step result when the same step is marked again (Positive, High)
- **Given**: Step #1 on an active Run is already `passed`
- **When**: The engineer marks step #1 as `failed`
- **Then**:
  - The step result updates to `failed`
  - The previous `passed` state is no longer shown
  - The ATC verdict recalculates based on the new step states

#### Scenario 6.2: Should update ATC verdict when a re-mark changes the verdict outcome (Positive, High)
- **Given**: An ATC with 2 steps — step 1 is `passed`, step 2 is `passed`; ATC verdict = `passed`
- **When**: The engineer re-marks step 1 as `failed`
- **Then**: The ATC verdict recalculates to `failed`

---

### Inferred / Edge scenarios — NEEDS PO/DEV CONFIRMATION

#### Scenario E1: Should handle concurrent step marking without data corruption (Edge, Critical) — NEEDS PO/DEV CONFIRMATION
- **Given**: Two users simultaneously submit mark-step requests for the same step on the same Run
- **When**: Both requests arrive within the same DB transaction window
- **Then**: One result is persisted deterministically (last write wins); no error is surfaced to either user; the step is not left in a corrupt/null state

#### Scenario E2: Should prevent step marking by users without run access (Negative, High) — NEEDS PO/DEV CONFIRMATION
- **Given**: A user who is not a member of the Run's project
- **When**: The user attempts to mark a step on that Run
- **Then**: The request is rejected with a 403 response

#### Scenario E3: Should reject a step re-mark back to pending status (Negative, Medium) — NEEDS PO/DEV CONFIRMATION
- **Given**: Step #1 is currently `passed` on an active Run
- **When**: The engineer attempts to mark step #1 as `pending`
- **Then**: The request is rejected (pending is an initial state, not a valid marking target) OR accepted (last-write-wins applies to all statuses including pending) — behavior undefined in story

---

## 4. ATP DRAFT — Test Outline

### Coverage estimate

| Type | Count |
|---|---|
| Positive | 10 |
| Negative | 6 |
| Boundary | 3 |
| Integration | 4 |
| **Total** | **23** |

**Rationale**: The story involves a non-trivial state machine (8 step-state combinations for ATC verdict), real-time push (testable integration point), a guard condition against finished/aborted runs, and last-write-wins semantics. 10 positive outlines cover the full verdict matrix. 6 negative outlines cover the two guard cases plus authorization, validation, and re-mark to invalid states. 3 boundary outlines cover progress at 0%, 50%, and 100%, and evidence link at max length. 4 integration outlines cover the real-time transport, the BK-34→BK-35 data contract, the BK-39 finish-run guard dependency, and the BK-40 defect-filing handoff.

### Outlines

#### Positive

1. **Should record a passed result on a pending step with note and evidence link** — Pre: active Run with pending step #1. Expected: step = passed, note stored, evidence URL stored, progress increments.
2. **Should record a passed result with no note or evidence (optional fields omitted)** — Pre: active Run with pending step. Expected: passed recorded, null fields, no validation error.
3. **Should record a failed result on a pending step** — Pre: active Run with pending step. Expected: step = failed, ATC verdict = failed.
4. **Should record a blocked result on a pending step** — Pre: active Run with all steps pending. Expected: step = blocked, ATC verdict not yet resolved while siblings still pending (PO confirm).
5. **Should set ATC verdict to passed when all steps are marked passed** — Pre: 2-step ATC Run, both pending. Expected: after marking both passed, ATC verdict = passed.
6. **Should set ATC verdict to failed when any step is marked failed** — Pre: 2-step ATC. Expected: step 1 passed, step 2 failed → ATC = failed.
7. **Should set ATC verdict to blocked when blocked and no failed steps** — Pre: 2-step ATC. Expected: step 1 blocked, step 2 passed → ATC = blocked.
8. **Should set ATC verdict to failed when both failed and blocked steps exist** — Pre: 2-step ATC. Expected: step 1 failed, step 2 blocked → ATC = failed.
9. **Should advance run progress percentage as steps resolve** — Pre: 4-step Run. Expected: 0% → 25% → 50% → 75% → 100% as each step is marked.
10. **Should replace previous step result when a step is re-marked with a different status** — Pre: step already marked passed. Expected: re-mark as failed → step = failed, ATC verdict recalculated.

#### Negative

11. **Should reject step result recording on a finished Run** — Pre: Run status = finished. Expected: request rejected, clear message, no DB change.
12. **Should reject step result recording on an aborted Run** — Pre: Run status = aborted. Expected: request rejected, message differentiated from finished (PO confirm), no DB change.
13. **Should reject step marking by a user without project membership** — Pre: Run exists, user is not a project member. Expected: 403, no step result stored. **NEEDS PO/DEV CONFIRMATION**
14. **Should reject evidence link with invalid URL format** — Pre: active Run, valid step. Expected: validation error, step not updated, DB unchanged. **NEEDS PO/DEV CONFIRMATION** (URL validation rule not defined)
15. **Should reject an empty string evidence link treated as null** — Pre: engineer submits evidenceLink: "". Expected: treated as null / no validation error OR rejected as invalid — depends on PO answer. **NEEDS PO/DEV CONFIRMATION**
16. **Should reject re-marking a step to pending status** — Pre: step already passed. Expected: 400/422 with message explaining pending is not a valid mark target — **NEEDS PO/DEV CONFIRMATION** (if pending is allowed as last-write-wins, this becomes positive)

#### Boundary

17. **Should record step result when run has exactly 1 step (minimum steps)** — Pre: Run with single step. Expected: marking it resolves the run; progress = 100%; ATC verdict computed immediately.
18. **Should record run progress at exactly 100% when the last remaining pending step is marked** — Pre: Run with N steps, N-1 already resolved, 1 pending. Expected: marking the last step advances progress to exactly 100.
19. **Should store a note at maximum allowed character length** — Pre: note field at max chars (exact limit NEEDS PO/DEV CONFIRMATION). Expected: stored successfully, not truncated.

#### Integration

20. **Should reflect step result and ATC verdict update in real time for a concurrent observer** — Pre: User A on active Run, User B watching same Run. Expected: after User A marks step, User B's UI updates within defined latency window without refresh. **NEEDS PO/DEV CONFIRMATION** on transport and SLA.
21. **Should correctly read the BK-34 step snapshot (not live ATC definition) when recording results** — Pre: ATC definition changed after Run was started by BK-34. Expected: Run step list reflects the snapshot, not the updated ATC.
22. **Should block step marking when the Run is moved to finished state mid-session (BK-39 race)** — Pre: BK-35 mark-step request arrives after BK-39 finishes the run. Expected: guard fires, run remains finished, step not updated.
23. **Should expose step result data in a format consumable by BK-40 defect filing** — Pre: step marked as failed. Expected: the failed step result includes sufficient context (step ID, run ID, evidence link, note) for BK-40 to pre-fill a defect. **NEEDS PO/DEV CONFIRMATION** on the defect-filing data contract.

---

## 5. Edge Cases — Extended Scan (HIGH risk)

| # | Edge case | Criticality |
|---|---|---|
| 1 | Two users concurrently mark the same step (race condition on step result row) | CRITICAL |
| 2 | Run abort (BK-36) arrives while a mark-step request is in-flight | CRITICAL |
| 3 | ATC verdict recalculation after re-mark flips from passed → failed (ATC was previously reported as passed to a downstream observer) | CRITICAL |
| 4 | Progress formula divide-by-zero if Run has 0 steps (BK-34 guard bypassed or data corrupted) | HIGH |
| 5 | Realtime subscription drops mid-session — observer misses verdict update | HIGH |
| 6 | Re-marking a step back to `pending` — is de-escalation allowed? | HIGH |
| 7 | Note field containing Markdown / raw HTML / `<script>` injection | HIGH |
| 8 | All steps blocked (no pass, no fail) with some still pending — ATC verdict is ambiguous | HIGH |
| 9 | Run already at 100% progress but not yet "finished" via BK-39 — what is the state? | HIGH |
| 10 | Evidence link to an internal private URL (localhost, internal IP) stored and displayed | MEDIUM |
| 11 | Very long evidence URL (> 2048 chars) submitted | MEDIUM |
| 12 | Empty string `""` vs null for note or evidence — should behave identically | MEDIUM |
| 13 | Multiple ATCs in a single Run — marking steps in ATC-1 should not affect ATC-2's verdict | MEDIUM |
| 14 | Step result submitted by the CI executor mode (PAT with `run:execute` scope) — same rules apply | MEDIUM |
| 15 | BK-39 "finish run" fires automatically at 100% — does BK-35 still accept marks in the window between 100% and BK-39 auto-finish? | HIGH |

---

## 6. Open Questions for PO / Dev

> Only genuine gaps — each one directly blocks test design or sprint planning.

### For PO

**Q1 — ATC verdict while steps remain pending**
- **Context**: The DoD defines verdict for fully-resolved step sets. It is silent on partial resolution (some steps still `pending`).
- **Impact if unanswered**: 4 of the 8+ state-machine combinations in the test matrix cannot be asserted. Outlines #4, #8, and #20 are incomplete.
- **Suggested answer**: Verdict stays `unrun` (or a dedicated `in_progress` sub-state) until all steps are resolved. Emit the derived verdict only when the last pending step is marked.

**Q2 — Error message text for finished/aborted run guard**
- **Context**: DoD says "blocked with a clear message" but does not define the exact string.
- **Impact if unanswered**: Outlines #11 and #12 cannot assert the message. The message is also the only user-visible feedback for this guard path.
- **Suggested answer**: Define distinct messages, e.g., "This run has already finished — no further results can be recorded" and "This run was aborted — no further results can be recorded."

**Q3 — Does 100% progress auto-trigger BK-39 finish, or is it manual?**
- **Context**: If BK-39 fires automatically when all steps resolve, there is a race window where BK-35 would immediately be blocked by its own guard (AC DoD item 6).
- **Impact if unanswered**: Outline #18 (boundary: last step) and edge case #15 cannot be designed.
- **Suggested answer**: Keep finish as a manual explicit action (per BK-39's own story). Progress reaching 100% is a signal, not a trigger.

**Q4 — Who can mark steps (authorization model)?**
- **Context**: The story says "an engineer" but does not restrict to the Run's original executor or any specific role.
- **Impact if unanswered**: Outline #13 (unauthorized access) cannot be designed; authorization tests would be invalid.
- **Suggested answer**: Any authenticated workspace member with at least `member` role on the project can mark steps, regardless of who started the run.

### For Dev

**Q5 — Real-time transport mechanism and latency SLA**
- **Context**: "Live without refreshing" requires a specific transport (Supabase Realtime, SSE, polling). The test design for outline #20 and edge case #5 depends entirely on this choice.
- **Impact if unanswered**: Cannot write the integration outline for real-time behavior; cannot determine whether a manual tester can observe it without tooling.

**Q6 — Step result endpoint shape (URL + method + request/response schema)**
- **Context**: No API endpoint for marking a step exists in the current codebase. Without knowing `PATCH /api/v1/run-steps/{id}` or `POST /api/v1/runs/{id}/step-results`, API-level outlines cannot be finalized.
- **Impact if unanswered**: All API-level tests in the ATP are placeholder; the automation subagent (BK-35 Stage 5) cannot write test code.

**Q7 — Is step result mutable (UPDATE) or append-only (INSERT)?**
- **Context**: DoD item 7 says "latest result for a step is shown" — this could mean UPDATE the row or INSERT and display the most-recent record.
- **Impact if unanswered**: Determines whether Outline #10 (re-mark) and edge case #1 (concurrent mark) test a primary key conflict or an order-by-timestamp pattern.

**Q8 — Evidence link: URL string or file upload?**
- **Context**: If it is a URL string, validation tests check URL format. If it is a file upload, tests check MIME type, size limit, Supabase storage bucket configuration.
- **Impact if unanswered**: Outlines #14 and #15 cannot be finalized; the form component design also depends on this.

---

## 7. QA Summary

BK-35 is a **HIGH risk** story rated at SP=1, which appears significantly underestimated. The story covers a multi-layer state machine (step results → ATC verdict → run progress), real-time synchronization across concurrent users, a guard condition with dependencies on two sibling stories (BK-36 and BK-39), and last-write-wins semantics — all on a backend that does not yet exist. **SP=1 should be challenged in estimation**: the shift-left analysis produced 23 test outlines, 8 open questions requiring PO or Dev answers before sprint planning, and 15 edge cases of HIGH or CRITICAL severity.

**Main risk areas**: (1) The ATC verdict state machine has 4 partially-resolved combinations that are undefined in the story and will be implemented arbitrarily by dev without PO guidance. (2) The real-time transport is completely unspecified — "live without refreshing" is untestable until the mechanism is named. (3) The race condition between a concurrent mark-step call and BK-36/BK-39 is CRITICAL and has no resolution path in the current spec.

**Recommended next steps**: Answer Q1 (partial-resolution verdict) and Q3 (auto-finish at 100%) before estimation — these block the state-machine test matrix. Answer Q5 (realtime transport) before sprint planning — this blocks the integration outline. The story should enter sprint only after PO answers Q1–Q4 and Dev answers Q5–Q8; failing that, SP must be re-estimated upward to account for design resolution time.

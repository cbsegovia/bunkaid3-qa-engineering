# TEST: BK-264: TC11: should reject a status change given it moves backward or repeats the current status

**Jira Key:** [BK-482](https://jira.upexgalaxy.com/browse/BK-482)
**Status:** AUTOMATED
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

BK-264 — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: High
- ROI score: 8.0 (Frequency 4 x Impact 4 x Stability 3 / Effort 2 x Dependencies 3)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to the workspace
- Target bug exists in the current status shown in each Examples row

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/status` with `{ status: {target*status} }`, requesting a status that moves backward relative to the bug's current status, or repeats it.

### Expected Results

- Response is 422 with `code: "validation*failed"`, `details.reason: "status*transition_backward"`
- Message states "A bug's status cannot move backward."
- `bugs.status` is unchanged after the rejected request
- The same-status row (`in*progress` -> `in*progress`) is folded into this same backward-rejection bucket rather than exposed as a distinct code or handled as a silent no-op

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario Outline: should reject a status change given it moves backward or repeats the current status
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists with status "<current*status>" in workspace "{workspace*id}"

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/{bug*id}/status" with { status: "<target*status>" }

  # === VALIDATIONS ===
  Then the response is 422 with reason "status*transition*backward"
  And the bug's status remains "<current_status>"

  # === EQUIVALENT PARTITIONS ===
  Examples: Backward and same-status combinations
    | current*status | target*status |
    | resolved        | open          |
    | in_progress      | open          |
    | closed           | in_progress   |
    | in*progress      | in*progress   |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | Workspace where the actor has >= Member access |
| `{bug*id}` | A bug in `{workspace*id}` seeded at the `current_status` of each Examples row |

## Implementation Code

| Layer | File |
| --- | --- |
| API component | (pending — filled by test-automation) |
| UI component | N/A — API-only TC |
| Test file | (pending) |
| Fixture | (pending) |

## Architecture

API-only — `POST /api/v1/bugs/{id}/status`. Follows KATA ApiBase layer.

## Available Test IDs (UI)

N/A (API-only TC)

## Refinement Notes

Empirically validated against staging on 2026-08-14 (/sprint-testing Stage 2, outlines #14 and #15) — all 4 rows (3 genuine-backward + 1 same-status) returned 422 with the identical reason `status*transition*backward` and message "A bug's status cannot move backward.", matching `lib/bugs/errors.ts` SQLSTATE 45311 mapping. The same-status row (outline #15) was flagged NEEDS PO/DEV CONFIRMATION during Planning — resolved empirically: the API deliberately folds same-status re-entrancy into the backward bucket rather than exposing a distinct `status*transition*no_change` reason. Functionally safe (no unintended state change), but the message text is slightly imprecise for a same-status request since it did not literally move backward — flagged as a non-blocking message-precision observation for whoever owns `lib/bugs/errors.ts` next, per test-session-memory.md Probe outcomes.

---

## Related Issues

- is tested by: [BK-264](https://jira.upexgalaxy.com/browse/BK-264) - TMS-Defect Triage | Assign a defect to a workspace member and update its status

---

## Metadata

- **Created:** 15/8/2026
- **Updated:** 15/8/2026
- **Reporter:** Luis Eduardo Flores Villarroel
- **Assignee:** Luis Eduardo Flores Villarroel
- **Labels:** api, automation-candidate, epic-BK-31, high, regression

---

_Synced from Jira by sync-jira-issues_

# TEST: BK-264: TC12: should keep assignee and status changes independent of each other

**Jira Key:** [BK-484](https://jira.upexgalaxy.com/browse/BK-484)
**Status:** AUTOMATED
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

BK-264 — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: High
- ROI score: 6.0 (Frequency 3 x Impact 4 x Stability 3 / Effort 2 x Dependencies 3)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to the workspace
- A bug exists with both an assignee and a status already set (e.g. `closed` with an assignee)

### Action

Actor performs an assignment change (`POST /api/v1/bugs/{id}/assign`) and, independently, a status change (`POST /api/v1/bugs/{id}/status`) on the same bug, and checks that each field is unaffected by the other endpoint's write.

### Expected Results

- Reassigning a bug does not alter its `status` field — verified: reassigning a `closed` bug left `status: "closed"` unchanged
- Advancing/changing a bug's status does not alter its `assignee*user*id` field — verified: advancing status left `assignee*user*id` unchanged
- A DB spot-check on `bugs.assignee*user*id` and `bugs.status` confirms no cross-contamination between the two endpoints

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario Outline: should keep assignee and status changes independent of each other
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists in workspace "{workspace*id}" with assignee "{assignee*user*id}" and status "<initial*status>"

  # === ACTION ===
  When the actor performs "<action>" on the bug via its dedicated endpoint

  # === VALIDATIONS ===
  Then the untouched field "<untouched_field>" is unchanged after the write
  And a subsequent GET "/api/v1/bugs/{bug_id}" confirms no cross-contamination

  # === EQUIVALENT PARTITIONS ===
  Examples: Independence directions
    | action                            | untouched_field   |
    | reassign (POST .../assign)        | status             |
    | change status (POST .../status)   | assignee*user*id   |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | Workspace where the actor has >= Member access |
| `{bug*id}` | A `closed` bug in `{workspace*id}` with an assignee already set |
| `{assignee*user*id}` | The bug's currently-assigned member |

## Implementation Code

| Layer | File |
| --- | --- |
| API component | (pending — filled by test-automation) |
| UI component | N/A — both endpoints are API-only |
| Test file | (pending) |
| Fixture | (pending) |

## Architecture

API-only — both assign and status endpoints.

## Available Test IDs (UI)

N/A (API-only TC)

## Refinement Notes

Empirically validated against staging on 2026-08-14 (/sprint-testing Stage 2, outline #18) — reassigning a `closed` bug left `status: "closed"` unchanged; advancing a bug's status left `assignee*user*id` unchanged. No cross-contamination observed in either direction, confirmed via DB spot-check per test-session-memory.md DB Exploration table. This is a beyond-AC risk case (data integrity / field cross-contamination) surfaced by Error-Guessing technique during Stage 1 Planning, not a directly-stated AC.

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

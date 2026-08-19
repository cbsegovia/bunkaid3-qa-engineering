# TEST: BK-264: TC7: should reject a write action given the actor is a Viewer-role member

**Jira Key:** [BK-486](https://jira.upexgalaxy.com/browse/BK-486)
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

- Actor is authenticated as an active member of the workspace with role `viewer` (no Member-level write access)
- Target bug exists in the workspace

### Action

Actor (Viewer role) POSTs either `/api/v1/bugs/{bug*id}/assign` (action=assign) or `/api/v1/bugs/{bug*id}/status` (action=status-change) with a valid body for that action.

### Expected Results

- Response is 403 with `code: "forbidden"`, `details.reason: "not*a*member"` for both actions
- The bug is unchanged by the rejected request

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario Outline: should reject a write action given the actor is a Viewer-role member
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists in workspace "{workspace_id}"
  And the actor is an active member of "{workspace_id}" with role "viewer"

  # === ACTION ===
  When the actor POSTs "<endpoint>" with a valid body for that action

  # === VALIDATIONS ===
  Then the response is 403 with reason "not*a*member"
  And the bug is unchanged by the rejected request

  # === EQUIVALENT PARTITIONS ===
  Examples: Write actions blocked for Viewer role
    | action        | endpoint                      |
    | assign        | /api/v1/bugs/{bug_id}/assign  |
    | status-change | /api/v1/bugs/{bug_id}/status  |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace*id}` | Workspace where the Viewer identity holds an active `workspace*members` row with role `viewer` |
| `{bug*id}` | A bug in `{workspace*id}` (any status/assignee) |

## Implementation Code

| Layer | File |
| --- | --- |
| API component | (pending — filled by test-automation) |
| UI component | N/A — API-only TC |
| Test file | (pending) |
| Fixture | (pending) |

## Architecture

API-only — both `POST /api/v1/bugs/{id}/assign` and `POST /api/v1/bugs/{id}/status`. Follows KATA ApiBase layer.

## Available Test IDs (UI)

N/A (API-only TC)

## Refinement Notes

Empirically validated against staging on 2026-08-14 (`/sprint-testing` Stage 2 execution, outlines #8 and #17) — a Viewer-role actor attempting either `assign` or `status` returned 403 with `code: "forbidden"`, `details.reason: "not*a*member"` in both cases.

***Observation carried from ***`test-session-memory.md`: the `reason` slug `not*a*member` is imprecise for this actor — a Viewer IS an active member of the workspace, just without write access. The 403 outcome itself is correct per the Story's authorization rule; only the `reason` slug conflates "not a member" with "member without write access." Flagged as a non-blocking message-precision cleanup, not a functional defect.

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

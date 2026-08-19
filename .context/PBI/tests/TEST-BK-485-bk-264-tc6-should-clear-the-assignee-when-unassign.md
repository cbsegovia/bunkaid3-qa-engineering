# TEST: BK-264: TC6: should clear the assignee when unassigning

**Jira Key:** [BK-485](https://jira.upexgalaxy.com/browse/BK-485)
**Status:** AUTOMATED
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

BK-264 — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: High
- ROI score: 6.0 (Frequency 4 x Impact 3 x Stability 3 / Effort 2 x Dependencies 3)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to the workspace
- Target bug exists already assigned to an eligible member

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/assign` with `{ assignee*user_id: null }`

### Expected Results

- Response is 200 OK
- Response body reflects `assignee*user*id: null`
- A subsequent `GET /api/v1/bugs/{bug_id}` reflects the bug as unassigned

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario: should clear the assignee when unassigning
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists in workspace "{workspace*id}" assigned to "{assignee*user_id}"

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/{bug*id}/assign" with { assignee*user_id: null }

  # === VALIDATIONS ===
  Then the response is 200 OK
  And the response body reflects assignee*user*id null
  And a subsequent GET "/api/v1/bugs/{bug_id}" reflects the bug as unassigned
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | Workspace where the actor has >= Member access |
| `{bug*id}` | A bug in `{workspace*id}` currently assigned to `{assignee*user*id}` |
| `{assignee*user*id}` | An active `workspace*members` row in `{workspace*id}` with role `member` or `owner` |

## Implementation Code

| Layer | File |
| --- | --- |
| API component | (pending — filled by test-automation) |
| UI component | N/A — API-only TC |
| Test file | (pending) |
| Fixture | (pending) |

## Architecture

API-only — `POST /api/v1/bugs/{id}/assign`. Follows KATA ApiBase layer.

## Available Test IDs (UI)

N/A (API-only TC)

## Refinement Notes

Empirically validated against staging on 2026-08-14 (`/sprint-testing` Stage 2 execution, outline #7) — unassigning an assigned bug returned 200 with `assignee*user*id: null`, confirmed on subsequent GET. No discrepancy.

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

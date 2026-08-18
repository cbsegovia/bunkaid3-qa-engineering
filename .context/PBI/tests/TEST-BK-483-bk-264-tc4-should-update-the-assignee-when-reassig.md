# TEST: BK-264: TC4: should update the assignee when reassigning to a different member

**Jira Key:** [BK-483](https://jira.upexgalaxy.com/browse/BK-483)
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
- Target bug exists already assigned to an eligible member (role `member`)
- A second eligible member (role `owner`) exists in the same workspace

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/assign` with `{ assignee*user*id: {new*assignee*user*id} }`, where `{new*assignee*user_id}` differs from the bug's current assignee.

### Expected Results

- Response is 200 OK
- Response body reflects `assignee*user*id` matching `{new*assignee*user_id}`
- A subsequent `GET /api/v1/bugs/{bug_id}` reflects the same new assignee
- The bug's previous assignee is no longer set as `assignee*user*id`

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario: should update the assignee when reassigning to a different member
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists in workspace "{workspace*id}" assigned to "{current*assignee*user*id}"
  And "{new*assignee*user*id}" is an active member of "{workspace*id}" with role "owner"

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/{bug*id}/assign" with { assignee*user*id: "{new*assignee*user*id}" }

  # === VALIDATIONS ===
  Then the response is 200 OK
  And the response body reflects assignee*user*id "{new*assignee*user_id}"
  And a subsequent GET "/api/v1/bugs/{bug_id}" reflects the same new assignee
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | Workspace where the actor has >= Member access |
| `{bug*id}` | A bug in `{workspace*id}` currently assigned to `{current*assignee*user_id}` |
| `{current*assignee*user*id}` | An active `workspace*members` row in `{workspace_id}` with role `member` |
| `{new*assignee*user*id}` | A different active `workspace*members` row in `{workspace_id}` with role `owner` |

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

Empirically validated against staging on 2026-08-14 (`/sprint-testing` Stage 2 execution, outline #5) — reassigning from the member identity to the owner identity returned 200 with `assignee*user*id` flipped to the new assignee, confirmed on subsequent GET. No discrepancy.

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

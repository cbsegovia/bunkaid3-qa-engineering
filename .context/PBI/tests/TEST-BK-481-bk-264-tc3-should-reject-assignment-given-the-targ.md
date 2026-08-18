# TEST: BK-264: TC3: should reject assignment given the target is a Viewer-role member

**Jira Key:** [BK-481](https://jira.upexgalaxy.com/browse/BK-481)
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
- Target bug exists in the workspace (any status)
- Target assignee is an active member of the same workspace with role `viewer`

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/assign` with `{ assignee*user*id: {viewer*user_id} }`

### Expected Results

- Response is 422 with `code: "validation*failed"`, `details.reason: "assignee*view_only"`
- `bugs.assignee*user*id` is unchanged after the rejected request

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario: should reject assignment given the target is a Viewer-role member
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists with status "open" in workspace "{workspace_id}"
  And "{viewer*user*id}" is an active member of "{workspace_id}" with role "viewer"

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/{bug*id}/assign" with { assignee*user*id: "{viewer*user_id}" }

  # === VALIDATIONS ===
  Then the response is 422 with reason "assignee*view*only"
  And the bug's assignee*user*id remains unchanged
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | Workspace where the actor has >= Member access |
| `{bug*id}` | A bug in `{workspace*id}` (any status) |
| `{viewer*user*id}` | An active `workspace*members` row in `{workspace*id}` with role `viewer` |

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

Empirically validated against staging on 2026-08-14 (`/sprint-testing` Stage 2 execution, outline #4) — assigning to an active Viewer-role member returned 422 with reason `assignee*view*only`, matching `lib/bugs/errors.ts` SQLSTATE 45313 mapping. No discrepancy.

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

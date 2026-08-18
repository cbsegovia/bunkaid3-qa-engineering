# TEST: BK-264: TC1: should set assignee when assigning an open bug to an eligible member

**Jira Key:** [BK-477](https://jira.upexgalaxy.com/browse/BK-477)
**Status:** AUTOMATED
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

[BK-264](https://jira.upexgalaxy.com/browse/BK-264) — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: Critical
- ROI score: 12.5 (Frequency 5 x Impact 5 x Stability 3 / Effort 2 x Dependencies 3)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to the workspace
- Target bug exists with status "open" and no current assignee
- Target assignee is an active member of the same workspace with role `member` or `owner` (not `viewer`)

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/assign` with `{ assignee*user*id: {member*user_id} }`

### Expected Results

- Response is 200 OK
- Response body reflects `assignee*user*id` matching `{member*user*id}`
- A subsequent `GET /api/v1/bugs/{bug_id}` reflects the same assignee
- `activity_log` records a `bug.assigned` event attributed to the acting user

### Gherkin (if Candidate)

```gherkin
@critical @regression @automation-candidate @BK-264
Scenario Outline: should set assignee when assigning an open bug to an eligible member
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists with status "open" in workspace "{workspace_id}"
  And "{assignee*user*id}" is an active member of "{workspace_id}" with role "<role>"

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/{bug*id}/assign" with { assignee*user*id: "{assignee*user_id}" }

  # === VALIDATIONS ===
  Then the response is 200 OK
  And the response body reflects assignee*user*id "{assignee*user*id}"
  And a subsequent GET "/api/v1/bugs/{bug_id}" reflects the same assignee

  # === EQUIVALENT PARTITIONS ===
  Examples: Eligible roles
    | role   |
    | member |
    | owner  |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | Workspace where the actor has >= Member access |
| `{bug*id}` | An "open" bug in `{workspace*id}` with no current assignee |
| `{assignee*user*id}` | An active `workspace*members` row in `{workspace*id}` with role IN (member, owner) |

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

Empirically validated against staging on 2026-08-14 (`/sprint-testing` Stage 2 execution, outline #1) — both role variants (`member`, `owner`) returned 200 with correct `assignee*user*id`. No discrepancy against the endpoint's implementation (`app/api/v1/bugs/[id]/assign/route.ts`).

---

## Related Issues

- is tested by: [BK-264](https://jira.upexgalaxy.com/browse/BK-264) - TMS-Defect Triage | Assign a defect to a workspace member and update its status

---

## Metadata

- **Created:** 15/8/2026
- **Updated:** 15/8/2026
- **Reporter:** Luis Eduardo Flores Villarroel
- **Assignee:** Luis Eduardo Flores Villarroel
- **Labels:** api, automation-candidate, critical, epic-BK-31, regression

---

_Synced from Jira by sync-jira-issues_

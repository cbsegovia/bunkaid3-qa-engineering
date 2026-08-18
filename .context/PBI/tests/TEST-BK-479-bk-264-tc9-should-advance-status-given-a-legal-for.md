# TEST: BK-264: TC9: should advance status given a legal forward transition

**Jira Key:** [BK-479](https://jira.upexgalaxy.com/browse/BK-479)
**Status:** AUTOMATED
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

BK-264 — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: High
- ROI score: 8.33 (Frequency 5 x Impact 5 x Stability 3 / Effort 3 x Dependencies 3)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to the workspace
- Target bug exists in the current status shown in each Examples row
- Row 3 (resolved -> closed) additionally requires an actor that is Member+ but is NOT the bug's current assignee

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/status` with `{ status: {target*status} }`, advancing the bug exactly one lifecycle stage forward (the only legal next status).

### Expected Results

- Response is 200 OK
- Response body reflects the new status matching `{target_status}`
- A subsequent GET `/api/v1/bugs/{bug_id}` reflects the same persisted status
- For row 3 specifically: a non-assignee Member+ actor (e.g. the workspace owner) can legally close a bug assigned to someone else — status-transition access is gated workspace-wide by "at least Member-level access", not restricted to the bug's specific assignee

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario Outline: should advance status given a legal forward transition
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists with status "<current*status>" in workspace "{workspace*id}"
  And the acting identity has at least Member-level access to "{workspace_id}"

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/{bug*id}/status" with { status: "<target*status>" }

  # === VALIDATIONS ===
  Then the response is 200 OK
  And the response body reflects status "<target_status>"
  And a subsequent GET "/api/v1/bugs/{bug_id}" reflects the same status

  # === EQUIVALENT PARTITIONS ===
  Examples: Legal forward transitions
    | current*status | target*status | actor                        |
    | open            | in_progress   | the bug's assignee            |
    | in_progress      | resolved      | the bug's assignee            |
    | resolved         | closed        | non-assignee Member+ (owner)  |
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

Empirically validated against staging on 2026-08-14 (/sprint-testing Stage 2 execution, outlines #10, #11, #12) — all three forward transitions returned 200 with status persisted correctly on re-query. Row 3 (resolved -> closed) exercised `business-rules.md`'s workspace-wide Member+ authorization model: the owner (not the bug's assignee) successfully closed it, confirming status-transition access is not assignee-restricted. No discrepancy against the endpoint's implementation (`app/api/v1/bugs/[id]/status/route.ts`).

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

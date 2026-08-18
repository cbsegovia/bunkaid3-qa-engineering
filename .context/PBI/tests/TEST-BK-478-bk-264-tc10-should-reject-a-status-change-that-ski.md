# TEST: BK-264: TC10: should reject a status change that skips a lifecycle stage

**Jira Key:** [BK-478](https://jira.upexgalaxy.com/browse/BK-478)
**Status:** AUTOMATED
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

[BK-264](https://jira.upexgalaxy.com/browse/BK-264) — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: High
- ROI score: 8.0 (Frequency 4 x Impact 4 x Stability 3 / Effort 2 x Dependencies 3)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass. This guardrail is explicitly named in the Story description ("skipping a stage or moving backward is structurally unreachable from the UI ... also rejected server-side, with a DB-level backstop").

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to the workspace
- Target bug exists in the current status shown in each Examples row

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/status` with `{ status: {target*status} }`, requesting a status that skips one or more lifecycle stages ahead of the bug's current status.

### Expected Results

- Response is 422 with `code: "validation*failed"`, `details.reason: "status*transition_skipped"`
- Message names the actual required next stage
- `bugs.status` is unchanged after the rejected request

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario Outline: should reject a status change that skips a lifecycle stage
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists with status "<current*status>" in workspace "{workspace*id}"

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/{bug*id}/status" with { status: "<target*status>" }

  # === VALIDATIONS ===
  Then the response is 422 with reason "status*transition*skipped"
  And the bug's status remains "<current_status>"

  # === EQUIVALENT PARTITIONS ===
  Examples: Skip combinations
    | current*status | target*status |
    | open            | resolved      |
    | open            | closed        |
    | in_progress      | closed        |
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

Empirically validated against staging on 2026-08-14 (`/sprint-testing` Stage 2, outline #13) — all 3 skip combinations returned 422 with the same reason and a message naming the required next stage, matching `lib/bugs/errors.ts` SQLSTATE 45310 mapping. No discrepancy.

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

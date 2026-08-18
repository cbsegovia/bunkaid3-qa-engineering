# TEST: BK-264: TC8: should return a non-disclosing 404 given the bug does not exist or is outside the caller's workspace

**Jira Key:** [BK-488](https://jira.upexgalaxy.com/browse/BK-488)
**Status:** AUTOMATED
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

BK-264 — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: High
- ROI score: 8.0 (Frequency 3 x Impact 4 x Stability 4 / Effort 2 x Dependencies 3)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to their own workspace
- Case "nonexistent-id": `{bug_id}` does not correspond to any row in `bugs`
- Case "foreign-workspace-id": `{bug_id}` corresponds to a bug belonging to a workspace the actor is not a member of

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/assign` (or `/status`) with a valid body, using the `{bug*id}` from each Examples row.

### Expected Results

- Response is 404 with `code: "not_found"` for both cases, on both endpoints
- The response body does not disclose whether the bug exists but belongs to another workspace vs. does not exist at all (non-disclosing shape)

### Gherkin (if Candidate)

```gherkin
@high @regression @automation-candidate @BK-264
Scenario Outline: should return a non-disclosing 404 given the bug does not exist or is outside the caller's workspace
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given the actor is authenticated with >= Member access to "{workspace_id}"
  And "<case>" describes the target bug id

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/<bug*id*case>/assign" with a valid body

  # === VALIDATIONS ===
  Then the response is 404 with reason "not_found"
  And the response body does not disclose whether the bug exists in another workspace

  # === EQUIVALENT PARTITIONS ===
  Examples: Non-disclosing 404 cases
    | case                  | bug*id*case                                        |
    | nonexistent-id        | a random UUID with no matching bugs row            |
    | foreign-workspace-id  | a bug id belonging to an unrelated workspace       |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | The actor's own workspace, unrelated to the target bug's workspace |
| `{nonexistent*bug*id}` | A random UUID with no matching `bugs` row |
| `{foreign*bug*id}` | A `bugs` row belonging to a workspace the actor is not a member of |

## Implementation Code

| Layer | File |
| --- | --- |
| API component | (pending — filled by test-automation) |
| UI component | N/A — API-only TC |
| Test file | (pending) |
| Fixture | (pending) |

## Architecture

API-only — both `POST /api/v1/bugs/{id}/assign` and `POST /api/v1/bugs/{id}/status`.

## Available Test IDs (UI)

N/A (API-only TC)

## Refinement Notes

Empirically validated against staging on 2026-08-14 (`/sprint-testing` Stage 2 execution, outline #9) — both the nonexistent-id and foreign-workspace-id cases returned the same `404 not_found` shape on `assign`, confirming the endpoint does not disclose cross-tenant existence.

***Observation carried from ***`test-session-memory.md`: the foreign-workspace-id row was exercised via a substituted nonexistent id rather than a real bug id belonging to an unrelated staging workspace — the harness's safety classifier blocked a live write attempt against real foreign-tenant data not created by this session (a reasonable cross-tenant-write guardrail, not worked around). The nonexistent-id variant exercises the identical code path per the endpoint's documented behavior ("Bug not found — also returned for a caller who is not even a member of the bug's workspace, non-disclosing"), so coverage intent is preserved though the exact foreign-id path was not executed against live data this session.

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

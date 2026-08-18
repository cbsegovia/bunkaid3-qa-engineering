# TEST: BK-264: TC13: should attribute an action to the actual calling actor, not the bug's assignee

**Jira Key:** [BK-487](https://jira.upexgalaxy.com/browse/BK-487)
**Status:** Candidate
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

BK-264 — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: Medium
- ROI score: 3.75 (Frequency 3 x Impact 5 x Stability 3 / Effort 3 x Dependencies 4)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to the workspace
- A bug exists in the target workspace, optionally already assigned to an identity different from the calling actor

### Action

Actor performs an action (assign or status change) on the bug via its dedicated endpoint, then inspect `activity*log.actor*user_id` for the resulting row.

### Expected Results

- `activity*log.actor*user_id` matches the actual calling identity (the performer) — never the bug's assignee or any third party
- Verified for 2 distinct actor/action pairs: an owner performing `bug.assigned`, and a member performing `bug.status_changed`

### Gherkin (if Candidate)

```gherkin
@medium @regression @automation-candidate @BK-264
Scenario Outline: should attribute an action to the actual calling actor, not the bug's assignee
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists in workspace "{workspace_id}"

  # === ACTION ===
  When "<actor_role>" performs "<action>" on the bug via its dedicated endpoint

  # === VALIDATIONS ===
  Then activity*log.actor*user*id matches the "<actor*role>" identity that made the call
  And activity*log.actor*user*id does not match the bug's assignee*user_id, when different, or any third party

  # === EQUIVALENT PARTITIONS ===
  Examples: Actor / action pairs
    | actor_role | action                             |
    | owner       | assign (POST .../assign)           |
    | member      | status change (POST .../status)    |
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{workspace_id}` | Workspace where the actor has >= Member access |
| `{bug*id}` | A bug in `{workspace*id}` |
| `{owner*user*id}` | The workspace owner identity (performs row 1) |
| `{member*user*id}` | An active Member-role identity (performs row 2) |

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

Empirically validated against staging on 2026-08-14 (/sprint-testing Stage 2, outline #19) — for both actor/action pairs, `activity*log.actor*user_id` matched the identity that actually made the call, never the bug's assignee or a third party. Confirms attribution is not spoofable through either endpoint. This is a beyond-AC risk case (audit trail / non-spoofable attribution) surfaced via Error-Guessing during Stage 1 Planning.

---

## Related Issues

- is tested by: [BK-264](https://jira.upexgalaxy.com/browse/BK-264) - TMS-Defect Triage | Assign a defect to a workspace member and update its status

---

## Metadata

- **Created:** 15/8/2026
- **Updated:** 15/8/2026
- **Reporter:** Luis Eduardo Flores Villarroel
- **Assignee:** Luis Eduardo Flores Villarroel
- **Labels:** api, automation-candidate, epic-BK-31, medium, regression

---

_Synced from Jira by sync-jira-issues_

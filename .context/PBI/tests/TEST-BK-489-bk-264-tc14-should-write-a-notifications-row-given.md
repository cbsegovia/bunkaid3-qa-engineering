# TEST: BK-264: TC14: should write a notifications row given a bug is assigned

**Jira Key:** [BK-489](https://jira.upexgalaxy.com/browse/BK-489)
**Status:** AUTOMATED
**Components:** Bugs & Defect Heatmap

---

## Test Description

## Related Story

BK-264 — TMS-Defect Triage | Assign a defect to a workspace member and update its status

## Priority / ROI

- Priority: Medium
- ROI score: 3.33 (Frequency 3 x Impact 5 x Stability 2 / Effort 3 x Dependencies 3)
- Outcome: Candidate

## Prior bugs covered

None — zero bugs found during BK-264's sprint-testing execution pass.

## Test Design

### Preconditions

- Actor is authenticated with at least Member-level access to the workspace
- A bug exists with status "open" and no current assignee in the target workspace

### Action

Actor POSTs `/api/v1/bugs/{bug*id}/assign` with `{ assignee*user*id: {member*user_id} }` — the first assignment on this bug.

### Expected Results

- Response is 200 OK, `assignee*user*id` set as expected
- Exactly 1 new row is written to the `notifications` table (verified via DB count before/after)
- The new row's shape matches the captured evidence below — this is a documented dependency for BK-212 (Notifications), which subscribes to this event

Captured `notifications` row (verbatim, from staging execution):

```json
{
  "id": "aeb386a5-d5ee-493a-9ef7-8f53fa2a2470",
  "workspace_id": "6646f244-a28c-441e-8486-9af33bdb5c11",
  "recipient*user*id": "c6a2b665-c090-4b74-b3df-6abcdae40c89",
  "event_type": "bug.assigned",
  "entity_type": "bug",
  "entity_id": "39d6834b-ae7b-4317-b6b7-5552928de6c3",
  "payload": {
    "title": "BK264 Primary happy-path chain defect",
    "run_id": null,
    "project_slug": "bk264-defect-triage",
    "assignee*user*id": "c6a2b665-c090-4b74-b3df-6abcdae40c89",
    "previous*assignee*user_id": null
  },
  "read_at": null,
  "created_at": "2026-08-14T11:37:07.610Z",
  "source*event*id": "a60cc106-d592-4e36-be3a-f632668f271c"
}
```

### Gherkin (if Candidate)

```gherkin
@medium @regression @automation-candidate @BK-264
Scenario: should write a notifications row given a bug is assigned
  """
  Related Story: BK-264
  """

  # === PRECONDITIONS ===
  Given a bug exists with status "open" and no current assignee in workspace "{workspace_id}"

  # === ACTION ===
  When the actor POSTs "/api/v1/bugs/{bug*id}/assign" with { assignee*user*id: "{assignee*user_id}" }

  # === VALIDATIONS ===
  Then the response is 200 OK
  And exactly 1 new row is written to the "notifications" table
  And the new row has event*type "bug.assigned", entity*type "bug", entity*id "{bug*id}", recipient*user*id "{assignee*user*id}"
  And payload.assignee*user*id equals "{assignee*user*id}" and payload.previous*assignee*user_id is null
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

API-only — `POST /api/v1/bugs/{id}/assign`, DB assertion on the `notifications` table.

## Available Test IDs (UI)

N/A (API-only TC)

## Refinement Notes

Empirically validated against staging on 2026-08-14 (/sprint-testing Stage 2, outline #20) — the `activity*log*notify*bug*event` trigger wrote exactly 1 new `notifications` row on first assignment; verbatim shape captured above. Per PO Decision #5, this is a documented dependency for BK-212 (Notifications) — a cross-ticket comment (BK-212 comment id 12332) already quotes this row shape for BK-212's future tester, noting the other 3 activity event types (`bug.reassigned`/`bug.unassigned`/`bug.status*changed`) will carry the same shape with different `event*type`/`payload`. This is a beyond-AC risk case (integration contract) surfaced during Stage 1 Planning.

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

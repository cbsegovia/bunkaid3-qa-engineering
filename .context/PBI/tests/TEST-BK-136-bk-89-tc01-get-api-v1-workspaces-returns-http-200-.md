# TEST: BK-89: TC01: GET /api/v1/workspaces returns HTTP 200 with correct workspace list shape

**Jira Key:** [BK-136](https://jira.upexgalaxy.com/browse/BK-136)
**Status:** AUTOMATED
**Components:** None

---

## Test Description

## TC01 — GET Happy Path: Workspace List Returned With Correct Shape

***Group:*** A-GET

***Precondition:***

- Authenticated user (QA bot) with a valid Bearer PAT
- User has at least one active workspace membership

***Steps:***

1. GET /api/v1/workspaces with Authorization: Bearer <token>
2. Inspect response status code
3. Inspect response body wrapper shape
4. Verify each workspace object contains the expected fields

***Expected:***

- Response: 200 OK
- Body wrapped in `{"workspaces": [...]`} (not a bare array)
- Each workspace object contains: id, slug, name, owner*user*id, plan, created_at
- Workspace count matches the user's active memberships

***Auth:*** Bearer PAT

---

## Related Issues

- tests: [BK-89](https://jira.upexgalaxy.com/browse/BK-89) - TMS-Workspace | View the workspaces I belong to

---

## Metadata

- **Created:** 12/6/2026
- **Updated:** 30/7/2026
- **Reporter:** Carlos Alberto Chiavassa
- **Assignee:** Carlos Alberto Chiavassa

---

_Synced from Jira by sync-jira-issues_

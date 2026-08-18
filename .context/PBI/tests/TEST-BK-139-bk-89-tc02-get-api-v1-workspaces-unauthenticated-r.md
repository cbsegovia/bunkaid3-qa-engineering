# TEST: BK-89: TC02: GET /api/v1/workspaces unauthenticated returns 401

**Jira Key:** [BK-139](https://jira.upexgalaxy.com/browse/BK-139)
**Status:** AUTOMATED
**Components:** None

---

## Test Description

## TC02 — GET Unauthenticated: Returns 401

***Group:*** A-GET

***Precondition:***

- No authentication provided — no session cookie, no Bearer token

***Steps:***

1. GET /api/v1/workspaces with no Authorization header and no session cookie
2. Inspect response status code
3. Inspect response body error structure

***Expected:***

- Response: 401 Unauthorized
- Body: `{"error": {"code": "unauthorized", "message": "Authentication required.", "request_id": "..."`}}
- No workspace data returned in the response body

***Auth:*** None (negative test — validates the auth gate)

---

## Related Issues

- tests: [BK-89](https://jira.upexgalaxy.com/browse/BK-89) - TMS-Workspace | View the workspaces I belong to

---

## Metadata

- **Created:** 12/6/2026
- **Updated:** 17/7/2026
- **Reporter:** Carlos Alberto Chiavassa
- **Assignee:** Carlos Alberto Chiavassa

---

_Synced from Jira by sync-jira-issues_

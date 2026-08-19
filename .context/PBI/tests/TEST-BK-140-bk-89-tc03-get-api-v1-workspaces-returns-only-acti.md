# TEST: BK-89: TC03: GET /api/v1/workspaces returns only active memberships — DB cross-validation

**Jira Key:** [BK-140](https://jira.upexgalaxy.com/browse/BK-140)
**Status:** MANUAL
**Components:** None

---

## Test Description

## TC03 — Active Memberships Filter: DB Cross-Validation

***Group:*** A-GET

***Precondition:***

- Authenticated user (QA bot) with a valid Bearer PAT
- User's membership state in `workspace_members` is known (mix of active / non-active rows, or at least one active row)

***Steps:***

1. Query `workspace*members` for the user: `SELECT COUNT(*) FROM workspace*members WHERE user*id = '<user*id>' AND status = 'active'`
2. GET /api/v1/workspaces with the same user's Bearer PAT
3. Count the workspaces returned in the API response
4. Compare the DB active-membership count against the API workspace count

***Expected:***

- API response workspace count equals the DB active-membership count for the user
- Suspended / invited (non-active) memberships are NOT included in the API response
- Confirms GET /api/v1/workspaces filters by `status = 'active'` at the DB level

***Auth:*** Bearer PAT + DB read access (DBHub MCP / direct SQL against the workspace_members table)

---

## Related Issues

- tests: [BK-89](https://jira.upexgalaxy.com/browse/BK-89) - TMS-Workspace | View the workspaces I belong to

---

## Metadata

- **Created:** 12/6/2026
- **Updated:** 14/7/2026
- **Reporter:** Carlos Alberto Chiavassa
- **Assignee:** Carlos Alberto Chiavassa

---

_Synced from Jira by sync-jira-issues_

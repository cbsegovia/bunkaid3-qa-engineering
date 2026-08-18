# TEST: BK-9: TC19: Validate unauthenticated request to module creation returns 401

**Jira Key:** [BK-81](https://jira.upexgalaxy.com/browse/BK-81)
**Status:** DEPRECATED
**Components:** None

---

## Test Description

## Test Case — TC19

Story: [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9) | ROI: 125 | Verdict: MANUAL

### Manual Steps

MANUAL TEST STEPS:

1. Send POST /api/v1/projects/{project_id}/modules with no session cookie and no Authorization header.

2. Body: {"name": "AuthTest"}

Expected: HTTP 401, error.code = "unauthorized"

### Variables

{project*id} — UUID of the test project | {root*id} — dynamically obtained from prior TC step

### Related

Story: [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9) | Regression Epic: [https://jira.upexgalaxy.com/browse/BK-70#icft=BK-70](https://jira.upexgalaxy.com/browse/BK-70#icft=BK-70) | Bugs: [https://jira.upexgalaxy.com/browse/BK-67#icft=BK-67](https://jira.upexgalaxy.com/browse/BK-67#icft=BK-67), [https://jira.upexgalaxy.com/browse/BK-68#icft=BK-68](https://jira.upexgalaxy.com/browse/BK-68#icft=BK-68) (if applicable)

---

## Metadata

- **Created:** 6/6/2026
- **Updated:** 8/6/2026
- **Reporter:** Andrés Daniel Cumare Morales
- **Assignee:** Andrés Daniel Cumare Morales
- **Labels:** manual-only, regression, security

---

_Synced from Jira by sync-jira-issues_

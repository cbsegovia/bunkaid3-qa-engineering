# TEST: BK-9: TC16: Validate duplicate sibling name returns 409 with module_slug_duplicate

**Jira Key:** [BK-78](https://jira.upexgalaxy.com/browse/BK-78)
**Status:** DEPRECATED
**Components:** None

---

## Test Description

## Test Case — TC16

Story: [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9) | ROI: 12 | Verdict: CANDIDATE

### Gherkin Scenario

```
@high @regression @automation-candidate @BK-9
Scenario: Validate duplicate sibling name is rejected
  """
  Related Story: BK-9
  ROI: 12 | UNIQUE constraint on (project_id, path)
  """
  Given module "Login" already exists at root level (path="login")
  When POST /api/v1/projects/{project_id}/modules with name "Login" again (same parent, same slugified name)
  Then response status is 409
  And response.error.code equals "conflict"
  And response.error.details.reason equals "module*slug*duplicate"
  And only one "login" path exists in the database
```

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
- **Labels:** automation-candidate, e2e, regression

---

_Synced from Jira by sync-jira-issues_

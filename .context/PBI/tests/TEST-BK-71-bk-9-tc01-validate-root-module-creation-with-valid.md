# TEST: BK-9: TC01: Validate root module creation with valid name

**Jira Key:** [BK-71](https://jira.upexgalaxy.com/browse/BK-71)
**Status:** DEPRECATED
**Components:** None

---

## Test Description

## Test Case — TC01

Story: [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9) | ROI: 25 | Verdict: CANDIDATE

### Gherkin Scenario

```
@critical @regression @automation-candidate @BK-9
Scenario: Validate root module creation with valid name
  """
  Related Story: BK-9
  ROI: 25 | Prior bugs: none
  """
  Given a workspace member is authenticated in project {project_id}
  When POST /api/v1/projects/{project_id}/modules with name "Login"
  Then response status is 201
  And response.module.path equals "login"
  And response.module.position equals 0
  And response.module.parent*module*id is null
  And response.warning is absent
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
- **Labels:** automation-candidate, critical, e2e, regression

---

_Synced from Jira by sync-jira-issues_

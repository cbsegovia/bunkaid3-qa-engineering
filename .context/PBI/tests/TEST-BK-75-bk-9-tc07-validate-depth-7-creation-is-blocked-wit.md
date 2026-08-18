# TEST: BK-9: TC07: Validate depth 7 creation is blocked with depth_exceeded

**Jira Key:** [BK-75](https://jira.upexgalaxy.com/browse/BK-75)
**Status:** DEPRECATED
**Components:** None

---

## Test Description

## Test Case — TC07

Story: [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9) | ROI: 10 | Verdict: CANDIDATE

### Gherkin Scenario

```
@critical @regression @automation-candidate @BK-9
Scenario: Validate depth 7 creation is rejected
  """
  Related Story: BK-9
  ROI: 10 | Hard limit: MAX*MODULE*DEPTH=6
  """
  Given a 6-level deep module chain exists (max depth reached)
  When POST /api/v1/projects/{project_id}/modules with valid name and parent = depth-6 module
  Then response status is 422
  And response.error.code equals "validation_failed"
  And response.error.details.reason equals "depth_exceeded"
  And no module is created in the database
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

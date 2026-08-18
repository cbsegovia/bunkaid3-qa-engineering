# TEST: BK-9: TC04: Validate depth 4 module has no warning (threshold is depth≥5)

**Jira Key:** [BK-73](https://jira.upexgalaxy.com/browse/BK-73)
**Status:** DEPRECATED
**Components:** None

---

## Test Description

## Test Case — TC04

Story: [https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9](https://jira.upexgalaxy.com/browse/BK-9#icft=BK-9) | ROI: 8 | Verdict: CANDIDATE

### Gherkin Scenario

```
@high @regression @automation-candidate @BK-9
Scenario: Validate depth 4 module has no warning
  """
  Related Story: BK-9
  ROI: 8 | RISK: OFF-BY-ONE — dev checklist incorrectly stated depth 4 triggers warning
  """
  Given a 3-level deep module chain exists (root/l2/l3 = path depth 3)
  When POST /api/v1/projects/{project_id}/modules with valid name and parent = l3 module
  Then response status is 201
  And response.warning is absent (no warning at depth 4 — threshold is depth≥5)
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

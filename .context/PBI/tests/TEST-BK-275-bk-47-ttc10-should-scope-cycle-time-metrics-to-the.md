# TEST: BK-47: TTC10: should scope cycle-time metrics to the active workspace and not expose data from another workspace

**Jira Key:** [BK-275](https://jira.upexgalaxy.com/browse/BK-275)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: Workspace isolation for cycle-time metrics
  Scenario: Story data from workspace A is invisible in workspace B
    Given workspace A has a project with stories that have run history
    And workspace B has a different project
    When the QA Lead switches to workspace B and navigates to its metrics page
    Then the recovery-cycle table shows only stories from workspace B
    And no story from workspace A is visible in the table or KPI

---

## Related Issues

- is designed by: [BK-270](https://jira.upexgalaxy.com/browse/BK-270) - ATP: BK-47: TMS-Coverage | Compute time-to-green per user story from run and bug history
- is executed by: [BK-283](https://jira.upexgalaxy.com/browse/BK-283) - ATR: BK-47: Story Testing

---

## Metadata

- **Created:** 5/8/2026
- **Updated:** 5/8/2026
- **Reporter:** Juan Ignacio Marmo
- **Assignee:** Juan Ignacio Marmo
- **Labels:** automation-candidate, regression

---

_Synced from Jira by sync-jira-issues_

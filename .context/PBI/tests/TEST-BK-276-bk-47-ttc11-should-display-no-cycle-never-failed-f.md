# TEST: BK-47: TTC11: should display No cycle never failed for a story with exactly one passing run and no failing run

**Jira Key:** [BK-276](https://jira.upexgalaxy.com/browse/BK-276)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: No cycle state - single passing run
  Scenario: Story with exactly one passing run never shows a cycle
    Given a user story has exactly one run and that run has verdict passed
    When the QA Lead views the recovery-cycle table
    Then the row shows the No cycle never failed chip
    And all timestamp columns display a dash
    And the story is excluded from the median KPI calculation

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

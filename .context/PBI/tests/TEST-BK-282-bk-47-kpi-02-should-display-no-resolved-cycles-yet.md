# TEST: BK-47: KPI-02: should display No resolved cycles yet empty state on the median KPI card when zero stories have recovered

**Jira Key:** [BK-282](https://jira.upexgalaxy.com/browse/BK-282)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: Median KPI empty state
  Scenario: Median KPI shows empty state when no story has recovered
    Given a project has stories with run history but none have reached Recovered state
    When the QA Lead views the metrics page
    Then the Median recovery cycle KPI card displays the message No resolved cycles yet no story has recovered from a failing run
    And no numeric duration is shown
    And the card does not display 0h 0m or any zero value

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
- **Labels:** automation-candidate, regression, smoke

---

_Synced from Jira by sync-jira-issues_

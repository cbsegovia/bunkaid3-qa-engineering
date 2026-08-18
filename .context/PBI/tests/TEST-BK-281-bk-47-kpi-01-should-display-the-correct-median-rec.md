# TEST: BK-47: KPI-01: should display the correct median recovery duration across all recovered stories

**Jira Key:** [BK-281](https://jira.upexgalaxy.com/browse/BK-281)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: Median recovery KPI card
  Scenario: Median KPI shows correct median when recovered stories exist
    Given a project has multiple stories in Recovered state with different cycle durations
    When the QA Lead views the metrics page
    Then the Median recovery cycle KPI card displays the median duration formatted as Xh Ym or Xd Yh Zm
    And the subtitle shows the count of resolved cycles
    And the median is computed only from Recovered stories, excluding Not yet green and No cycle rows

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

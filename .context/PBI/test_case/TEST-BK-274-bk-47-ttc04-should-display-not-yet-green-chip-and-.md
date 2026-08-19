# TEST: BK-47: TTC04: should display Not yet green chip and elapsed time so far for a story whose latest run is still failing

**Jira Key:** [BK-274](https://jira.upexgalaxy.com/browse/BK-274)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: In-progress cycle state
  Scenario: Still-failing story shows Not yet green with elapsed time
    Given a user story has at least one run with verdict failed
    And no subsequent run with verdict passed exists
    When the QA Lead views the recovery-cycle table
    Then the row for that story shows the Not yet green chip
    And the Cycle column displays a duration suffixed with so far
    And the First fail column shows the earliest failing run timestamp
    And the First green column displays a dash

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

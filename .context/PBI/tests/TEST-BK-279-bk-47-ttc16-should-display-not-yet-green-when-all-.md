# TEST: BK-47: TTC16: should display Not yet green when all runs after the first failure are aborted and no passing run exists

**Jira Key:** [BK-279](https://jira.upexgalaxy.com/browse/BK-279)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: Aborted runs excluded from clock-stop
  Scenario: Only aborted runs after initial failure keeps story as Not yet green
    Given a user story has a run with verdict failed
    And all subsequent runs for that story have verdict aborted
    And no run with verdict passed exists
    When the QA Lead views the recovery-cycle table
    Then the row shows the Not yet green chip
    And the Cycle column shows elapsed time from the first failing run to now with so far suffix
    And no aborted run is used as a clock-stop event

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

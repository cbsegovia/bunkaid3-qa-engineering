# TEST: BK-47: TTC02: should select the earliest failing run as clock start when the story has multiple failing runs

**Jira Key:** [BK-272](https://jira.upexgalaxy.com/browse/BK-272)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: Clock start selection
  Scenario: Earliest failing run used as clock start
    Given a user story has multiple runs with verdict failed at different timestamps
    And the story later has a run with verdict passed
    When the QA Lead views the recovery-cycle table
    Then the First fail column shows the timestamp of the chronologically first failing run
    And the Cycle duration is computed from that earliest failure to the first all-passing run

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

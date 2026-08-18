# TEST: BK-47: TTC03: should display No cycle never failed chip with dash in all timestamp columns for a story that never had a failing run

**Jira Key:** [BK-273](https://jira.upexgalaxy.com/browse/BK-273)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: No cycle state for always-passing stories
  Scenario: Story with only passing runs shows no-cycle state
    Given a user story has at least one run and all runs have verdict passed
    When the QA Lead views the recovery-cycle table
    Then the row for that story shows the chip labeled No cycle never failed
    And the First fail column displays a dash
    And the First green column displays a dash
    And the Cycle column displays a dash

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

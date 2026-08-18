# TEST: BK-47: TTC01: should display Recovered chip and formatted cycle duration for a story with a failing then passing run

**Jira Key:** [BK-271](https://jira.upexgalaxy.com/browse/BK-271)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: Recovery cycle state display
  Background:
    Given the QA Lead is authenticated and has an active workspace
    And a project exists with at least one user story

  Scenario: Recovered story shows Recovered chip and cycle duration
    Given a user story has at least one run with verdict failed recorded before a run with verdict passed
    When the QA Lead navigates to /projects/{slug}/metrics
    Then the recovery-cycle table row for that story shows the Recovered chip
    And the Cycle column displays a formatted duration (e.g. Xh Ym or Xd Yh Zm)
    And the First fail column displays the timestamp of the earliest failing run
    And the First green column displays the timestamp of the first all-passing run

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

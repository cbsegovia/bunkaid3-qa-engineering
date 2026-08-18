# TEST: BK-47: TTC12: should display zero duration or floor value when the failing and passing runs share the same created_at timestamp

**Jira Key:** [BK-277](https://jira.upexgalaxy.com/browse/BK-277)
**Status:** Borrador
**Components:** None

---

## Test Description

Feature: Clock boundary - zero elapsed time
  Scenario: Same-timestamp fail and pass runs result in zero or floor duration
    Given a user story has a failing run and a passing run with identical created_at timestamps
    When the QA Lead views the recovery-cycle table
    Then the row shows the Recovered chip
    And the Cycle column displays either 0s or a defined minimum non-negative duration
    And no error or blank value is rendered

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

---

_Synced from Jira by sync-jira-issues_

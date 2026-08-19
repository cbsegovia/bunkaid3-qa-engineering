# TEST: BK-47: TTC14: should display empty state when no story in the project has any run history

**Jira Key:** [BK-278](https://jira.upexgalaxy.com/browse/BK-278)
**Status:** Candidate
**Components:** None

---

## Test Description

Feature: Empty state when no run history exists
  Scenario: No stories with run history shows dedicated empty state
    Given a project exists with user stories but none of them have any runs executed
    When the QA Lead navigates to /projects/{slug}/metrics
    Then the recovery-cycle section displays the empty state message No stories with run history yet
    And no table rows are rendered
    And the median KPI card shows No resolved cycles yet

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

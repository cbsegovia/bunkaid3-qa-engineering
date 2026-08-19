# TEST: BK-47: TTC20: should display graceful degradation message when the recovery-cycle RPC fails

**Jira Key:** [BK-280](https://jira.upexgalaxy.com/browse/BK-280)
**Status:** MANUAL
**Components:** None

---

## Test Description

Feature: Graceful degradation on RPC failure
  Scenario: Recovery-cycle section degrades gracefully when data cannot be loaded
    Given the recovery-cycle RPC returns an error or the section fails to load
    When the QA Lead navigates to /projects/{slug}/metrics
    Then the recovery-cycle section renders a fallback error message
    And the message instructs the user to reload the page to try again
    And no JavaScript exception is thrown or blank white area is displayed

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
- **Labels:** manual-only, regression

---

_Synced from Jira by sync-jira-issues_

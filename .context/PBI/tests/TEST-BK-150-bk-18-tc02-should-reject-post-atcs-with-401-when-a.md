# TEST: BK-18: TC02: should reject POST /atcs with 401 when auth is missing/invalid and 403 when the token lacks atc:write scope

**Jira Key:** [BK-150](https://jira.upexgalaxy.com/browse/BK-150)
**Status:** Candidate
**Components:** None

---

## Test Description

---

**Related Story:** [https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18](https://jira.upexgalaxy.com/browse/BK-18#icft=BK-18)  |  **Epic:** [https://jira.upexgalaxy.com/browse/BK-13#icft=BK-13](https://jira.upexgalaxy.com/browse/BK-13#icft=BK-13)
**ATP:** [https://jira.upexgalaxy.com/browse/BK-94#icft=BK-94](https://jira.upexgalaxy.com/browse/BK-94#icft=BK-94)  |  **ATR:** [https://jira.upexgalaxy.com/browse/BK-95#icft=BK-95](https://jira.upexgalaxy.com/browse/BK-95#icft=BK-95)  |  **Pre-Condition:** [https://jira.upexgalaxy.com/browse/BK-161#icft=BK-161](https://jira.upexgalaxy.com/browse/BK-161#icft=BK-161)
**Test Set:** [https://jira.upexgalaxy.com/browse/BK-186#icft=BK-186](https://jira.upexgalaxy.com/browse/BK-186#icft=BK-186)  |  **Regression Plan:** [https://jira.upexgalaxy.com/browse/BK-65#icft=BK-65](https://jira.upexgalaxy.com/browse/BK-65#icft=BK-65)
**ROI verdict:** Candidate
**AC covered:** auth/scope gating (cross-cutting woven here, not a standalone security TC)
**Scenario:** see the Cucumber definition (Gherkin) on this Test.

---

---

## Related Issues

- tests: [BK-18](https://jira.upexgalaxy.com/browse/BK-18) - TMS-ATC API | Create and edit ATCs with steps and assertions

---

## Metadata

- **Created:** 20/6/2026
- **Updated:** 6/7/2026
- **Reporter:** Ely
- **Assignee:** Ely
- **Labels:** api, automation-candidate, regression, regression-candidate

---

_Synced from Jira by sync-jira-issues_

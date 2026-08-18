# TEST: BK-372-TDS05: External update does not flow back to Bunkai

**Jira Key:** [BK-238](https://jira.upexgalaxy.com/browse/BK-238)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***ATP:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) ATP | ****ATR:**** TBD | ****Pre-Condition:*** None

***Test Set:*** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) Defect Sync

***ROI verdict:*** Candidate

***AC covered:*** AC5

***Scenario:*** Given a defect is synced, when the external item is updated, then no change flows back to Bunkai — GET defect returns original fields.

KATA ATC: `DefectsApi.externalUpdateDoesNotFlowBack()` → assert fields unchanged

---

## Related Issues

- is tested by: [BK-372](https://jira.upexgalaxy.com/browse/BK-372) - TMS-Defect Sync | Send a newly filed defect to Jira

---

## Metadata

- **Created:** 22/7/2026
- **Updated:** 14/8/2026
- **Reporter:** Nahuel Gomez
- **Assignee:** Unassigned
- **Labels:** api, automation-candidate, defect-sync

---

_Synced from Jira by sync-jira-issues_

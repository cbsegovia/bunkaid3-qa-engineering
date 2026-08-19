# TEST: BK-372-TDS06: No sync when integration not configured

**Jira Key:** [BK-239](https://jira.upexgalaxy.com/browse/BK-239)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***ATP:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) ATP | ****ATR:**** TBD | ****Pre-Condition:*** None

***Test Set:*** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) Defect Sync

***ROI verdict:*** Candidate

***AC covered:*** AC6

***Scenario:*** Given the workspace has no external tracker integration enabled, when a defect is filed in Bunkai, then no sync is attempted and no sync error is returned.

KATA ATC: `DefectsApi.createDefectNoIntegration()` → assert 201, no sync fields

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

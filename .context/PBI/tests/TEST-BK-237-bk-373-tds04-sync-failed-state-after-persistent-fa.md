# TEST: BK-373-TDS04: Sync-failed state after persistent failure

**Jira Key:** [BK-237](https://jira.upexgalaxy.com/browse/BK-237)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***ATP:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) ATP | ****ATR:**** TBD | ****Pre-Condition:*** None

***Test Set:*** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) Defect Sync

***ROI verdict:*** Candidate

***AC covered:*** AC3

***Scenario:*** Given the external tracker is persistently unreachable, when a defect cannot be synced after all retries, then the defect shows sync_status=failed and remains usable.

KATA ATC: `DefectsApi.getDefectSyncFailed()` → assert 201, sync*status=failed, sync*attempts≥1

---

## Related Issues

- is tested by: [BK-373](https://jira.upexgalaxy.com/browse/BK-373) - TMS-Defect Sync | Recover a failed sync and show its state

---

## Metadata

- **Created:** 22/7/2026
- **Updated:** 14/8/2026
- **Reporter:** Nahuel Gomez
- **Assignee:** Unassigned
- **Labels:** api, automation-candidate, defect-sync

---

_Synced from Jira by sync-jira-issues_

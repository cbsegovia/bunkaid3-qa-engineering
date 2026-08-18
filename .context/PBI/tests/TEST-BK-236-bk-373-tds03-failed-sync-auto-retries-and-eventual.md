# TEST: BK-373-TDS03: Failed sync auto-retries and eventually succeeds

**Jira Key:** [BK-236](https://jira.upexgalaxy.com/browse/BK-236)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***ATP:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) ATP | ****ATR:**** TBD | ****Pre-Condition:*** None

***Test Set:*** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) Defect Sync

***ROI verdict:*** Candidate

***AC covered:*** AC3

***Scenario:*** Given a sync attempt failed, when the retry mechanism runs, then it re-attempts the sync and eventually succeeds with sync_status=synced.

KATA ATC: `DefectsApi.createDefectAutoRetries()` → assert sync_status transitions to synced

Implementation: tests/integration/defects/defect-sync.test.ts — tagged @defect-sync @critical

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

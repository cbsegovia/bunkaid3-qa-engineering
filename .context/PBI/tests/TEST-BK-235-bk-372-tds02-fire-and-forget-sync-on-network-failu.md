# TEST: BK-372-TDS02: Fire-and-forget sync on network failure

**Jira Key:** [BK-235](https://jira.upexgalaxy.com/browse/BK-235)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***ATP:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) ATP | ****ATR:**** TBD | ****Pre-Condition:*** None

***Test Set:*** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) Defect Sync

***ROI verdict:*** Candidate

***AC covered:*** AC2

***Scenario:*** Given the external tracker is unreachable, when a defect is filed, then it is created locally with sync_status=pending and sync is retried later.

KATA ATC: `DefectsApi.createDefectFireAndForget()` → assert 201, sync_status=pending

Implementation: tests/integration/defects/defect-sync.test.ts — tagged @defect-sync @critical

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

# TEST: BK-373-TDS08: Permanent auth failure stops retries

**Jira Key:** [BK-241](https://jira.upexgalaxy.com/browse/BK-241)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***ATP:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) ATP | ****ATR:**** TBD | ****Pre-Condition:*** None

***Test Set:*** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) Defect Sync

***ROI verdict:*** Candidate

***AC covered:*** Risk-beyond-AC

***Scenario:*** Given credentials are permanently invalid, when sync fails with auth error, then retries stop after threshold and defect shows sync_status=failed.

KATA ATC: `DefectsApi.syncFailsOnPermanentAuth()` → assert sync_status=failed

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

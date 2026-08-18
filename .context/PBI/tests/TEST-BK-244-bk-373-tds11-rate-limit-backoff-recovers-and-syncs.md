# TEST: BK-373-TDS11: Rate limit backoff recovers and syncs

**Jira Key:** [BK-244](https://jira.upexgalaxy.com/browse/BK-244)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***Scenario:*** Given the external tracker returns 429, when the next sync fires, then it waits and retries with backoff and eventually succeeds.

KATA ATC: `DefectsApi.rateLimitBackoff()` → assert final sync_status=synced

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

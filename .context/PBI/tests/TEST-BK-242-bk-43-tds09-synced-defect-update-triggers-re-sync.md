# TEST: BK-43-TDS09: Synced defect update triggers re-sync

**Jira Key:** [BK-242](https://jira.upexgalaxy.com/browse/BK-242)
**Status:** DEPRECATED
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***Scenario:*** Given a synced defect is edited in Bunkai, when the update is saved, then the change propagates to the external tracker.

KATA ATC: `DefectsApi.updateDefectReSyncs()` → assert 200, external_id unchanged

---

## Related Issues

- is tested by: [BK-43](https://jira.upexgalaxy.com/browse/BK-43) - TMS-Defect Sync | Sync defects one-way to the external tracker

---

## Metadata

- **Created:** 22/7/2026
- **Updated:** 14/8/2026
- **Reporter:** Nahuel Gomez
- **Assignee:** Unassigned
- **Labels:** api, automation-candidate, defect-sync

---

_Synced from Jira by sync-jira-issues_

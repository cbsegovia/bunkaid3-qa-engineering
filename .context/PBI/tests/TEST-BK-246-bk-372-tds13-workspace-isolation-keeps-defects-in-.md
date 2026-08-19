# TEST: BK-372-TDS13: Workspace isolation keeps defects in correct projects

**Jira Key:** [BK-246](https://jira.upexgalaxy.com/browse/BK-246)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***Scenario:*** Given defects in two different workspaces, when synced to different external tracker projects, then each defect lands in its correct target.

KATA ATC: `DefectsApi.workspaceIsolation()` → assert workspace_id present and targets correct project

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

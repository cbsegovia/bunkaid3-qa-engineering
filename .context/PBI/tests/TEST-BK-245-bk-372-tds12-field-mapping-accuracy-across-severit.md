# TEST: BK-372-TDS12: Field mapping accuracy across severity levels

**Jira Key:** [BK-245](https://jira.upexgalaxy.com/browse/BK-245)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***Scenario:*** Given a defect with severity, module, evidence fields, when synced, then severity maps to priority, module to component, evidence to attachment correctly.

KATA ATC: `DefectsApi.fieldMappingAccuracy()` → assert all severity levels map correctly

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

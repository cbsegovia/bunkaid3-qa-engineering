# TEST: BK-372-TDS14: Synced defect carries external link back to Bunkai

**Jira Key:** [BK-247](https://jira.upexgalaxy.com/browse/BK-247)
**Status:** In Automation
**Components:** None

---

## Test Description

***Related Story:**** [BK-43](https://jira.upexgalaxy.com/browse/BK-43) | ****Epic:*** [BK-31](https://jira.upexgalaxy.com/browse/BK-31)

***Scenario:*** Given a defect is synced successfully, then the external tracker item contains a link back to the original defect in Bunkai.

KATA ATC: `DefectsApi.createDefectCarriesExternalLink()` → assert 201, external_url contains Bunkai URL

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

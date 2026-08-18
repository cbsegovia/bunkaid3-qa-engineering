# TEST: BK-3: TC05: Tampered OAuth state cookie returns 403 (CSRF protection)

**Jira Key:** [BK-474](https://jira.upexgalaxy.com/browse/BK-474)
**Status:** Borrador
**Components:** None

---

## Test Description

Story: BK-3 · AC-5

Given an OAuth sign-in flow is in progress with a custom state cookie
When the state cookie is tampered with before the callback
Then the server returns 403 on mismatch

Unassigned — available for UPEX students to automate.

---

## Metadata

- **Created:** 14/8/2026
- **Updated:** 14/8/2026
- **Reporter:** Nahuel Gomez
- **Assignee:** Unassigned
- **Labels:** oauth

---

_Synced from Jira by sync-jira-issues_

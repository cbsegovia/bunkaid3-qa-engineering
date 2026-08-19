# TEST: BK-148: TC#7: should complete the create-rename-delete environment flow through the project explorer UI

**Jira Key:** [BK-196](https://jira.upexgalaxy.com/browse/BK-196)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

medium — happy-path UI once API guards pass

## ROI

3.6 · Candidate

## Covers

ATP TC#20 (create) + TC#21 (rename) + TC#22 (delete) — E2E

## Test Design

```
@medium @regression @automation-candidate @BK-148
Scenario: should create, rename and delete an environment via the UI
  # === PRECONDITIONS ===
  Given a member is on the project explorer for "{project}"
  # === ACTION + VALIDATIONS ===
  When they click [data-testid=environment-add]
  And submit "{name}" in [data-testid=create-environment-name] via [data-testid=create-environment-submit]
  Then a row [data-testid=explorer-environment-{id}] appears with "{name}"
  When they open [data-testid=environment-menu-{id}] and click [data-testid=environment-rename-{id}]
  And submit "{new_name}" in [data-testid=rename-environment-name]
  Then the row shows "{new_name}"
  When they open the menu and click [data-testid=environment-remove-{id}]
  And confirm [data-testid=delete-environment-confirm]
  Then the row is removed from the list
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {project} | A project the member owns |
| {name},{new_name} | Unique names not already present |
| {id} | Read from the created row's testid |

## Architecture

E2E (Playwright). All controls carry data-testid — no fallback locators needed.

## Test IDs

`environment-add`, `create-environment-name`, `create-environment-submit`, `explorer-environment-{id`}, `environment-menu-{id`}, `environment-rename-{id`}, `rename-environment-name`, `rename-environment-submit`, `environment-remove-{id`}, `delete-environment-confirm` (`project-explorer.tsx`, `*-form.tsx`, `delete-environment-dialog.tsx`).

## Expected

Each CRUD step reflects in the list; success shows a sonner toast; no errors.

---

## Related Issues

- is tested by: [BK-148](https://jira.upexgalaxy.com/browse/BK-148) - TMS-Project Environments | List, add, rename and remove environments

---

## Metadata

- **Created:** 10/7/2026
- **Updated:** 4/8/2026
- **Reporter:** micaelavirgagarcia
- **Assignee:** Deiberson Escalante
- **Labels:** automation-candidate, e2e, medium, regression

---

_Synced from Jira by sync-jira-issues_

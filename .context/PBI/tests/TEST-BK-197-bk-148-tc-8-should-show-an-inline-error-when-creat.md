# TEST: BK-148: TC#8: should show an inline error when creating an environment with a duplicate name

**Jira Key:** [BK-197](https://jira.upexgalaxy.com/browse/BK-197)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

medium

## ROI

3.2 · Candidate

## Covers

ATP TC#24 (duplicate-name UI error)

## Refinement note (ATP-vs-code)

Errors render ***inline*** in `[data-testid=create-environment-error]`, NOT as a toast. Assert the inline element; input is preserved on error.

## Test Design

```
@medium @regression @automation-candidate @BK-148
Scenario: should surface a duplicate-name error inline
  # === PRECONDITIONS ===
  Given project "{project}" has an environment "{existing}"
  And the create-environment modal is open
  # === ACTION ===
  When the member submits "{existing}"
  # === VALIDATIONS ===
  Then [data-testid=create-environment-error] is visible and mentions "already exists"
  And the name input still contains "{existing}" (input preserved)
  And no success toast appears
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {existing} | A name already present in {project} |

## Architecture

E2E. `create-environment-form.tsx` (setError → inline `<p>`, no toast.error).

## Expected

Inline error visible; input preserved; no toast.

---

## Related Issues

- is tested by: [BK-148](https://jira.upexgalaxy.com/browse/BK-148) - TMS-Project Environments | List, add, rename and remove environments

---

## Metadata

- **Created:** 10/7/2026
- **Updated:** 10/7/2026
- **Reporter:** micaelavirgagarcia
- **Assignee:** micaelavirgagarcia
- **Labels:** automation-candidate, e2e, medium, regression

---

_Synced from Jira by sync-jira-issues_

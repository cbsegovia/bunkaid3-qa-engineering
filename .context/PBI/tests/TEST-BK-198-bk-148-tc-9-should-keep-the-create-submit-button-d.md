# TEST: BK-148: TC#9: should keep the create submit button disabled when the environment name is empty

**Jira Key:** [BK-198](https://jira.upexgalaxy.com/browse/BK-198)
**Status:** MANUAL
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

low — UX guard, human visual judgment

## ROI

1.2 · Manual

## Covers

ATP TC#23 — REFRAMED. The original "empty-name 422 toast" is unreachable via UI: submit is `disabled` while trimmedName.length < 1, and no toast is used. This Manual TC verifies the disabled-button guard instead.

## Test Design (manual steps)

1. Open the create-environment modal on a project.
2. Leave the name input empty (or type only spaces).
3. Observe [data-testid=create-environment-submit].

## Expected

Submit button is disabled; no request is fired; no error toast (the field simply cannot be submitted). Typing a non-space char enables it.

## Why Manual

Visual/UX state assertion with low regression value; disabled-state is stable and cheap to eyeball. Revisit as Candidate only if the guard regresses.

---

## Related Issues

- is tested by: [BK-148](https://jira.upexgalaxy.com/browse/BK-148) - TMS-Project Environments | List, add, rename and remove environments

---

## Metadata

- **Created:** 10/7/2026
- **Updated:** 10/7/2026
- **Reporter:** micaelavirgagarcia
- **Assignee:** micaelavirgagarcia
- **Labels:** e2e, low, manual-only, regression

---

_Synced from Jira by sync-jira-issues_

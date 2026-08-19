# TEST: BK-148: TC#10: should render the environments section with its list or empty state

**Jira Key:** [BK-199](https://jira.upexgalaxy.com/browse/BK-199)
**Status:** MANUAL
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

low — smoke render

## ROI

1.0 · Manual

## Covers

ATP TC#19 (section loads)

## Note

ATP's "within 2 seconds" is a cross-cutting performance assertion, not a per-feature TC — dropped from scope here (belongs to a perf suite if one is stood up).

## Test Design (manual steps)

1. Open the project explorer for a project.
2. Locate [data-testid=explorer-environments-group].

## Expected

The environments section renders and shows either the list of rows or [data-testid=explorer-environments-empty]. No crash, no infinite spinner.

## Why Manual

Basic render smoke; low ROI; covered implicitly by the E2E CRUD flow (TC#7). Kept as a documented manual check.

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

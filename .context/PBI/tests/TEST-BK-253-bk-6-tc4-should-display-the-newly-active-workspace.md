# TEST: BK-6: TC4: should display the newly active workspace in the header switcher after switch and page reload

**Jira Key:** [BK-253](https://jira.upexgalaxy.com/browse/BK-253)
**Status:** Candidate
**Components:** Tenancy & Identity

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-6#icft=BK-6](https://jira.upexgalaxy.com/browse/BK-6#icft=BK-6) — TMS-Workspace | Switch between workspaces

## Priority / ROI

- Priority: High
- ROI score: 6.0 (Frequency 3 x Impact 4 x Stability 3 / Effort 3 x Dependencies 2)
- Outcome: Candidate

## Prior bugs covered

- (none)

## Test Design

### Preconditions

- User has already switched the active workspace to `{workspace*to*id`} via the API (TC1 precondition/action)

### Action

User reloads the page (full page reload)

### Expected Results

- Header workspace switcher displays `{workspace*to*name`} as the active workspace, both immediately after switching and after reload
- Dropdown lists all workspaces the user belongs to, with the active one visually marked

### Gherkin (if Candidate)

```
@high @regression @automation-candidate @BK-6
Scenario: should display the newly active workspace in the header switcher after switch and page reload
  Given a user has switched the active workspace to "{workspace*to*id}" via the API
  When the user reloads the page
  Then the header workspace switcher displays "{workspace*to*name}" as the active workspace
  And the dropdown lists all workspaces the user belongs to with the active one marked
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| `{workspace*to*id`} / `{workspace*to*name`} | Target workspace from the TC1 fixture (same switch precondition) |

## Implementation Code

| ***Layer**** | ****File*** |
| --- | --- |
| UI component | **(pending — filled by test-automation)** |
| Test file | **(pending)** |
| Fixture | **(pending)** |

## Architecture

UI + Integration — Playwright, KATA UiBase, WorkspaceSwitcher component.

## Available Test IDs (UI)

- Not captured during Stage 1/2 exploration (not in ATP/test-session-memory). ***Gap***: `test-automation` must inspect the WorkspaceSwitcher component for `data-testid` selectors before automating.

## Refinement Notes

Navigation target after switch is `/projects`, not `/home` as the original spec assumed — accepted as correct behavior (spec was stale; PO decision 2026-06-06). Automation must assert against `/projects`, not `/home`. Also note: the switcher only renders once the workspace has at least 1 project (OBS-002, non-bug, expected UX) — fixture setup for this TC must ensure both workspaces have a project.

---

## Related Issues

- tests: [BK-6](https://jira.upexgalaxy.com/browse/BK-6) - TMS-Workspace | Switch between workspaces

---

## Metadata

- **Created:** 31/7/2026
- **Updated:** 31/7/2026
- **Reporter:** Luis Eduardo Flores Villarroel
- **Assignee:** Luis Eduardo Flores Villarroel
- **Labels:** automation-candidate, e2e, epic-BK-1, regression

---

_Synced from Jira by sync-jira-issues_

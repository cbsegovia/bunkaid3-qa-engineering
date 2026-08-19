# TEST: BK-6: TC2: should reject the switch with 403 given the user has no membership in the target workspace

**Jira Key:** [BK-251](https://jira.upexgalaxy.com/browse/BK-251)
**Status:** AUTOMATED
**Components:** Tenancy & Identity

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-6#icft=BK-6](https://jira.upexgalaxy.com/browse/BK-6#icft=BK-6) — TMS-Workspace | Switch between workspaces

## Priority / ROI

- Priority: Critical
- ROI score: 80.0 (Frequency 4 x Impact 5 x Stability 4 / Effort 1 x Dependencies 1)
- Outcome: Candidate

## Prior bugs covered

- (none)

## Test Design

### Preconditions

- User is authenticated
- User has NO membership row in `{non*member*workspace_id`} (workspace belongs to a different tenant)

### Action

User POSTs `/api/v1/me/active-workspace` with {{{ workspace*id: {non*member*workspace*id} }}}

### Expected Results

- Response is 403 Forbidden
- Session's `active*workspace*id` is NOT changed

### Gherkin (if Candidate)

```
@critical @regression @automation-candidate @BK-6
Scenario: should reject the switch with 403 given the user has no membership in the target workspace
  Given a user authenticated with no membership row in "{non*member*workspace_id}"
  When the user POSTs "/api/v1/me/active-workspace" with { workspace*id: "{non*member*workspace*id}" }
  Then the response is 403 Forbidden
  And the session's active*workspace*id is not changed
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| `{user*id`} | `SELECT id FROM auth.users WHERE email = '{STAGING*USER_EMAIL}'` |
| `{non*member*workspace*id`} | Any workspace with zero rows in `workspace*members` for `{user_id`} |

## Implementation Code

| ***Layer**** | ****File*** |
| --- | --- |
| API component | **(pending — filled by test-automation)** |
| Test file | **(pending)** |
| Fixture | **(pending)** |

## Architecture

API-only. Follows KATA ApiBase layer.

## Available Test IDs (UI)

- N/A (API-only TC)

## Refinement Notes

Spec (AC2) expects error code `NOT*A*MEMBER`; implementation returns generic `forbidden` (relies on RLS filtering rather than an explicit status check). Per PO decision (2026-06-06): accepted, non-blocking. Automation must assert on HTTP 403 only, not on a specific error code.

---

## Related Issues

- tests: [BK-6](https://jira.upexgalaxy.com/browse/BK-6) - TMS-Workspace | Switch between workspaces

---

## Metadata

- **Created:** 31/7/2026
- **Updated:** 8/8/2026
- **Reporter:** Luis Eduardo Flores Villarroel
- **Assignee:** Luis Eduardo Flores Villarroel
- **Labels:** automation-candidate, e2e, epic-BK-1, regression

---

_Synced from Jira by sync-jira-issues_

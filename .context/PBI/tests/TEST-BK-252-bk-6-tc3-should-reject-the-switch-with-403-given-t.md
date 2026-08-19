# TEST: BK-6: TC3: should reject the switch with 403 given the user's membership in the target workspace is suspended

**Jira Key:** [BK-252](https://jira.upexgalaxy.com/browse/BK-252)
**Status:** AUTOMATED
**Components:** Tenancy & Identity

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-6#icft=BK-6](https://jira.upexgalaxy.com/browse/BK-6#icft=BK-6) — TMS-Workspace | Switch between workspaces

## Priority / ROI

- Priority: Critical
- ROI score: 20.0 (Frequency 4 x Impact 5 x Stability 4 / Effort 2 x Dependencies 2)
- Outcome: Candidate

## Prior bugs covered

- (none)

## Test Design

### Preconditions

- User is authenticated
- User has a `workspace*members` row for `{suspended*workspace_id`} with `status = "suspended"`

### Action

User POSTs `/api/v1/me/active-workspace` with {{{ workspace*id: {suspended*workspace_id} }}}

### Expected Results

- Response is 403 Forbidden
- Session's `active*workspace*id` is NOT changed
- DB: the membership row's `status` remains `"suspended"` after the attempt (unchanged)

### Gherkin (if Candidate)

```
@critical @regression @automation-candidate @BK-6
Scenario: should reject the switch with 403 given the user's membership in the target workspace is suspended
  Given a user authenticated with a workspace*members row for "{suspended*workspace_id}" where status is "suspended"
  When the user POSTs "/api/v1/me/active-workspace" with { workspace*id: "{suspended*workspace_id}" }
  Then the response is 403 Forbidden
  And the session's active*workspace*id is not changed
  And the workspace*members row for "{suspended*workspace_id}" still has status "suspended"
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| `{user*id`} | `SELECT id FROM auth.users WHERE email = '{STAGING*USER_EMAIL}'` |
| `{suspended*workspace*id`} | Workspace where `{user*id`}'s `workspace*members.status = 'suspended'` (seed via test setup fixture, restore to `active` after the run — mandatory cleanup) |

## Implementation Code

| ***Layer**** | ****File*** |
| --- | --- |
| API component | **(pending — filled by test-automation)** |
| DB helper | **(pending — needs seed + cleanup fixture for suspended membership)** |
| Test file | **(pending)** |
| Fixture | **(pending)** |

## Architecture

API + DB — Follows KATA ApiBase layer; DB assertion via DBHub / direct query helper.

## Available Test IDs (UI)

- N/A (API/DB-only TC)

## Refinement Notes

Same gap as TC2 — implementation returns generic `forbidden`, not `MEMBERSHIP*SUSPENDED`. Non-blocking per PO decision. The DB check (`workspace*members.status`) must be part of the assertion, not just the HTTP code, per triforce (API+DB) coverage.

***Gap found during Stage 4 analysis (not AC-covered):*** `workspace_members.status` allows a third value, `invited` (pending, unaccepted invite) — enforced by a live DB CHECK constraint (`status = ANY (ARRAY['active','invited','suspended'])`). Neither the AC nor this TC set covers a switch attempt while `status='invited'`. Not created as a TC here — it was never validated, and per the Improvement-bridge rule this should be surfaced as a product/spec gap (should an invited-but-unaccepted user get 403, or a different response?), not silently added as a regression TC.

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

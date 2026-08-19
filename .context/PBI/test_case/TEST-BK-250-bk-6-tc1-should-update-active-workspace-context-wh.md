# TEST: BK-6: TC1: should update active workspace context when switching to a workspace given the user is an active member

**Jira Key:** [BK-250](https://jira.upexgalaxy.com/browse/BK-250)
**Status:** Candidate
**Components:** Tenancy & Identity

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-6#icft=BK-6](https://jira.upexgalaxy.com/browse/BK-6#icft=BK-6) — TMS-Workspace | Switch between workspaces

## Priority / ROI

- Priority: Critical
- ROI score: 25.0 (Frequency 5 x Impact 5 x Stability 4 / Effort 2 x Dependencies 2)
- Outcome: Candidate

## Prior bugs covered

- [https://jira.upexgalaxy.com/browse/BK-83#icft=BK-83](https://jira.upexgalaxy.com/browse/BK-83#icft=BK-83) — Switch response missing {id, slug, name, role} fields (fixed, verified 2026-06-12)

## Test Design

### Preconditions

- User is authenticated
- User has an active membership (status = "active") in both `{workspace*from*id`} and `{workspace*to*id`}

### Action

User POSTs `/api/v1/me/active-workspace` with {{{ workspace*id: {workspace*to_id} }}}

### Expected Results

- Response is 200 OK
- Response body contains {{{ ok: true, active*workspace*id, id, slug, name, role }}} matching `{workspace*to*id`}
- Session cookie `bk*active*ws` is rotated to `{workspace*to*id`}
- Subsequent GET `/api/v1/me` reflects `active*workspace*id = {workspace*to*id`}

### Gherkin (if Candidate)

```
@critical @regression @automation-candidate @BK-6
Scenario: should update active workspace context when switching to a workspace given the user is an active member
  Given a user authenticated with an active membership in "{workspace*from*id}" and "{workspace*to*id}"
  When the user POSTs "/api/v1/me/active-workspace" with { workspace*id: "{workspace*to_id}" }
  Then the response is 200 OK
  And the response body contains { ok: true, active*workspace*id: "{workspace*to*id}", id: "{workspace*to*id}", slug, name, role }
  And a subsequent GET "/api/v1/me" reflects active*workspace*id "{workspace*to*id}"
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| `{user*id`} | `SELECT id FROM auth.users WHERE email = '{STAGING*USER_EMAIL}'` |
| `{workspace*from*id`} | Workspace where `{user_id`} has an active membership (starting workspace) |
| `{workspace*to*id`} | Second workspace where `{user_id`} has an active membership (target workspace) |

## Implementation Code

| ***Layer**** | ****File*** |
| --- | --- |
| API component | **(pending — filled by test-automation)** |
| UI component | **(n/a — API-only TC)** |
| Test file | **(pending)** |
| Fixture | **(pending)** |

## Architecture

API-only — POST /api/v1/me/active-workspace + GET /api/v1/me follow-up. Follows KATA ApiBase layer.

## Available Test IDs (UI)

- N/A (API-only TC)

## Refinement Notes

Original AC1 spec response schema `{id, slug, name, role`} did not match the implementation on first pass ([https://jira.upexgalaxy.com/browse/BK-83#icft=BK-83](https://jira.upexgalaxy.com/browse/BK-83#icft=BK-83)) — implementation returned only `{ok, active*workspace*id`}. Fixed and verified 2026-06-12; response now matches spec. No further discrepancy.

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

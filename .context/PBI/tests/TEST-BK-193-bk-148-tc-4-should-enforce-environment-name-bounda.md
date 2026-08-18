# TEST: BK-148: TC#4: should enforce environment name boundaries by trimming and rejecting empty or over-50-char names

**Jira Key:** [BK-193](https://jira.upexgalaxy.com/browse/BK-193)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

[https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148](https://jira.upexgalaxy.com/browse/BK-148#icft=BK-148)

## Priority

high — input boundary integrity

## ROI

5.3 · Candidate

## Covers

ATP TC#9 (trim) + TC#10 (empty) + TC#11 (>50) — BVA

## Refinement note (ATP-vs-code)

ATP expected the 422 message "between 1 and 50 characters". The route rejects via ***Zod first**** → `code:"validation_failed"`, message "Request body failed validation.", `details` is an ****array*** of issues. Assert on `code`, not the exact string.

## Test Design

```
@high @regression @automation-candidate @BK-148
Scenario Outline: should enforce name-length boundaries (BVA)
  # === PRECONDITIONS ===
  Given project "{project}" exists
  # === ACTION ===
  When a member POST "/api/v1/projects/{project}/environments" with {"name":"<input>"}
  # === VALIDATIONS ===
  Then the response status is <status>
  And <assertion>
  # === EQUIVALENT PARTITIONS ===
  Examples: boundary valid
    | input            | status | assertion                                  |
    | "  Dev  "        | 201    | persisted name is "Dev" (trimmed)          |
    | {name*1*char}    | 201    | created (min boundary)                     |
    | {name*50*chars}  | 201    | created (max boundary)                     |
  Examples: boundary invalid
    | input            | status | assertion                                  |
    | ""               | 422    | code is "validation_failed"                |
    | "   "            | 422    | code is "validation_failed" (whitespace)   |
    | {name*51*chars}  | 422    | code is "validation_failed" (over max)     |
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {name*1*char} | "x" |
| {name*50*chars} | "x"·50 |
| {name*51*chars} | "x"·51 |

## Architecture

API. Zod `.trim().min(1).max(50)` (`validation.ts:14-22`); RPC `btrim` backstop (`0032:115-118`).

## Expected

201 (trimmed/boundary-valid); 422 `validation_failed` with `details` array (empty/whitespace/over-max).

---

## Related Issues

- is tested by: [BK-148](https://jira.upexgalaxy.com/browse/BK-148) - TMS-Project Environments | List, add, rename and remove environments

---

## Metadata

- **Created:** 10/7/2026
- **Updated:** 10/7/2026
- **Reporter:** micaelavirgagarcia
- **Assignee:** micaelavirgagarcia
- **Labels:** automation-candidate, high, integration, regression

---

_Synced from Jira by sync-jira-issues_

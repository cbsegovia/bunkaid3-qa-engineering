# TEST: BK-38: TC02: should narrow Run list and recompute totals when combined filters applied

**Jira Key:** [BK-321](https://jira.upexgalaxy.com/browse/BK-321)
**Status:** Candidate
**Components:** None

---

## Test Description

## Related Story

 — Unknown

## Priority / ROI

- Priority: {color:red|Critical}
- ROI score: 4.2
- Outcome: {color:green|Candidate}

## Prior bugs covered

(none)

## Test Design

### Preconditions

- User is authenticated with valid PAT token
- Test project exists with valid UUID

### Action

Execute the test scenario as described in the summary

### Expected Results

- API response matches expected behavior
- Status code is as expected

### Gherkin

```gherkin
@critical @regression @automation-candidate @BK
Scenario Outline: 
  Given the API is available
  When the user executes the test
  Then the response matches expectations
```

## Variables

| ***Variable**** | ****How to obtain*** |
| --- | --- |
| {session_token} | From login response |

## Implementation Code

To be filled by test-automation

## Architecture

Integration — follows KATA layers

## Available Test IDs

N/A — API-only test

## Refinement Notes

Auto-generated enrichment for batch processing

---

## Related Issues

- designs: [BK-318](https://jira.upexgalaxy.com/browse/BK-318) - [ATP] BK-38 — TMS-Run Reporting | Filter project runs with pass/fail totals
- executes: [BK-319](https://jira.upexgalaxy.com/browse/BK-319) - [ATR] BK-38 — TMS-Run Reporting | Filter project runs with pass/fail totals

---

## Metadata

- **Created:** 8/8/2026
- **Updated:** 12/8/2026
- **Reporter:** jesusgpythondev
- **Assignee:** jesusgpythondev

---

_Synced from Jira by sync-jira-issues_

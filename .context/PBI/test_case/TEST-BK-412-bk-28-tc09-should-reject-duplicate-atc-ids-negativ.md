# TEST: BK-28: TC09: should reject duplicate ATC ids [negative]

**Jira Key:** [BK-412](https://jira.upexgalaxy.com/browse/BK-412)
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

## Metadata

- **Created:** 12/8/2026
- **Updated:** 12/8/2026
- **Reporter:** jesusgpythondev
- **Assignee:** jesusgpythondev

---

_Synced from Jira by sync-jira-issues_

# TEST: BK-45: TC17: should exclude an archived AC and its archived ATC from the chain

**Jira Key:** [BK-449](https://upexgalaxy71.atlassian.net/browse/BK-449)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

AC-06 requires archived ACs and their archived ATCs to be excluded from the chain view. This is a data-integrity concern on core entities — one of the two independent grounds that forced this ATP to Full (the other being auth/authorization). A regression in the archival filter predicate would surface stale/retired coverage as if it were still active, misleading anyone reading the chain about the story's real current coverage. Unit and DB-integration tests can assert the filter predicate against a mocked or seeded row set; only a live render proves the archived AC/ATC pair is invisible end-to-end, alongside an active sibling on the same story, with no partial leakage of either.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Any PR touching the archival filter or the chain-assembly query |
| Impact | 4 | Data-integrity risk — stale coverage shown as current is misleading, not a leak |
| Stability | 4 | AC-06 exclusion rule is finalized, no open ratification questions |
| Effort | 2 | One story with one active + one archived AC/ATC pair, one page load |
| Dependencies | 2 | Needs a story seeded with both an active and an archived AC |

**ROI = (4 x 4 x 4) / (2 x 2) = 16.0** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should exclude an archived AC and its archived ATC from the chain
  """
  Related Story: BK-45
  Test outline: TC-BK45-17 (ATP Stage 1) — AC-06
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" with 1 active acceptance criterion (with 1 bound ATC) and 1 archived acceptance criterion (with 1 bound ATC)

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then only the active acceptance criterion renders
  And only its bound ATC renders
  And the archived acceptance criterion and its archived ATC do not appear anywhere on the page
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

A story seeded with one active AC/ATC pair and one archived AC/ATC pair.

## Expected results

The chain shows only the active AC and its ATC; the archived pair is fully absent from the rendered page.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

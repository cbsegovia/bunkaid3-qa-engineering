# TEST: BK-45: TC11: should render a mixed story correctly given some ACs full chain and some uncovered

**Jira Key:** [BK-463](https://upexgalaxy71.atlassian.net/browse/BK-463)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

This is the ATP's explicitly flagged untested residual. `resolveStoryChainViewState` has no dedicated "partial/mixed" state — a story with some covered and some uncovered ACs resolves to `has-chain`, and each `AcCard` independently decides whether to render its full chain or its uncovered strip. Before this ATR, that branch was only unit- and DB-integration-tested (`story-traceability-isolation.test.ts`, 11/11 passing) and had never been exercised live against a seeded example. A regression causing state to bleed between adjacent AC cards — one card's "covered" render leaking styling/data into a sibling's "uncovered" render, or vice versa — is exactly the class of bug that only a live, side-by-side render can catch; it is invisible to any test that renders a single `AcCard` in isolation.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 4 | Any PR touching `AcCard` or the story-level view-state resolver |
| Impact | 5 | The ATP's explicitly flagged highest-concern residual besides the two security items |
| Stability | 3 | Newly live-verified this session — previously only unit/DB-tested, not exercised live |
| Effort | 2 | Single page load against a mixed-coverage story |
| Dependencies | 2 | Needs a story with 2+ ACs, mixed coverage, seeded live |

**ROI = (4 x 5 x 3) / (2 x 2) = 15.0** -> Candidate

## Test design

```gherkin
@high @regression @e2e @automation-candidate @BK-45
Scenario: should render a mixed story correctly — some ACs full chain, some uncovered, same page load
  """
  Related Story: BK-45
  ATP outline: TC-BK45-11
  Priority residual item — flagged untested branch, now live-verified
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" in project "{project_slug}" with 2 or more ACs, some with a full covered chain and some with zero ATCs bound

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the covered ACs render their full chain
  And the uncovered ACs render the "Uncovered · 0 ATCs bound" strip
  And no state bleeds from one AC card into another, side by side on the same page load
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |

## Preconditions

Story `27223d20-915e-4e03-b1ae-f9a6efb33980` (BK-35), with mixed coverage across its ACs (AC-B has zero ATCs bound).

## Expected results

Both covered and uncovered states render correctly side by side, with no state bleeding between AC cards.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

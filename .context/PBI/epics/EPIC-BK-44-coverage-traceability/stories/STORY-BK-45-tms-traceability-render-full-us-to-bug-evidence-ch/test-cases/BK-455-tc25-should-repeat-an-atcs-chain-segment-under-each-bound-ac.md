# TEST: BK-45: TC25: should repeat an ATC's chain segment under each bound AC given the ATC is bound to 2+ ACs on the same story

**Jira Key:** [BK-455](https://upexgalaxy71.atlassian.net/browse/BK-455)
**Status:** Candidate
**Components:** Coverage & Traceability

---

## Test Description

## Why this is regression-worthy

The ATP explicitly ratifies "no ATC dedup across ACs" as a resolution ruling (A5/EC3): when a single ATC is bound to 2+ acceptance criteria on the same story, its chain segment must repeat under EACH bound AC, not collapse to a single appearance. This is a structural rule a developer's instinct commonly fights — deduplicating repeated rows is the default behavior for most list-rendering components and grid libraries. A regression that "cleans up" perceived duplicate rows by keying on ATC identity alone (instead of the AC-ATC binding pair) would silently hide the ATC's coverage under one of its bound ACs, understating that AC's real coverage — a traceability-integrity bug that directly undermines the epic's purpose (turning existing evidence into a trustworthy single-page picture). This binding-fanout behavior is inherently multi-row and cross-AC, so it can only be proven live against a story with a genuinely shared ATC — a unit test on a single AC's render path cannot exercise it.

## ROI

| Factor | Score | Reasoning |
| --- | --- | --- |
| Frequency | 3 | Touched whenever the chain-assembly query or the AC-card rendering loop changes |
| Impact | 4 | Silently hiding coverage under one AC is a traceability-integrity bug, core to this Epic |
| Stability | 3 | Multi-row list rendering is a common target for well-intentioned "dedup cleanup" refactors |
| Effort | 2 | One story with one ATC bound to 2 ACs, one page load, two-location assertion |
| Dependencies | 2 | Needs a fixture with an ATC deliberately bound to 2+ ACs on the same story |

**ROI = (3 x 4 x 3) / (2 x 2) = 9.0** -> Candidate

## Test design

```gherkin
@medium @regression @e2e @automation-candidate @BK-45
Scenario: should repeat an ATC's chain segment under each bound AC when bound to 2+ ACs on the same story
  """
  Related Story: BK-45
  Test outline: TC-BK45-25 (ATP Stage 1) — EP / A5+EC3 (no ATC dedup across ACs)
  """

  # === PRECONDITIONS ===
  Given an authenticated workspace member with at least viewer role
  And a user story "{story_id}" where one ATC "{atc_id}" is bound to two acceptance criteria, "{ac_id_1}" and "{ac_id_2}"

  # === ACTION ===
  When the member opens "/projects/{project_slug}/traceability?story={story_id}"

  # === VALIDATIONS ===
  Then the ATC's chain segment appears under "{ac_id_1}"
  And the ATC's chain segment appears again, in full, under "{ac_id_2}"
  And neither appearance is deduplicated, collapsed, or cross-referenced instead of rendered
```

## Variables

| Variable | How to obtain |
| --- | --- |
| `{project_slug}` | Project settings, or the `/projects` list |
| `{story_id}` | `data-testid="story-row-<uuid>"` in the traceability sidebar |
| `{atc_id}`, `{ac_id_1}`, `{ac_id_2}` | Respective `data-testid` attributes on the ATC row and AC cards |

## Preconditions

A story with one ATC deliberately bound to two acceptance criteria on the same story.

## Expected results

The ATC's chain segment renders in full under both bound ACs, with no dedup or collapse.

---

**Related Story**: BK-45 — TMS-Traceability | Render full US to bug evidence chain in one read
**Regression epic**: BK-70 (QA Test Repository)
**Source**: BK-45 ATP Stage 1 (2026-08-05), executed and recorded in the BK-45 ATR (2026-08-08)

---

## Related Issues

- tests: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

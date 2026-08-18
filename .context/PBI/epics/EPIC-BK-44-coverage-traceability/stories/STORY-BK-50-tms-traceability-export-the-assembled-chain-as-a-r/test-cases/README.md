# BK-50 — Stage 4 prioritization report

**Date**: 2026-08-09 · **Scope**: ticket-driven · **Modality**: jira-native · **Regression epic**: BK-70 (QA Test Repository)

Synced Jira mirrors of the created Tests live in `.context/PBI/test_case/TEST-BK-33*.md` — this folder holds the prioritization record, which is not a Jira artifact.

## Outcome

| Verdict | Count | Share |
|---|---|---|
| Candidate | 6 | 26% |
| Manual | 0 | 0% |
| Deferred | 17 | 74% |

23 outlines derived in Stage 1, **6 persisted** as regression Tests, 6 handed to `/test-automation`. The healthy shape the doctrine asks for — derive widely, persist narrowly.

## The discriminator: unit-test overlap

This story arrived with **32 automated tests already green** — 13 in `lib/traceability/export-snapshot.test.ts` and 19 in `lib/traceability/chain-view.test.ts`. Those cover the *rendering* layer thoroughly: filename slugification and truncation, self-containment at the HTML-string level, zero-AC prose, the zero-coverage banner and uncovered strip, full-chain field rendering, HTML-injection escaping, the archived banner, workspace/project identity, the export timestamp, and all six run-state tone/label mappings.

Persisting E2E regression TCs over that ground would buy nothing and cost maintenance forever. So the regression set was scoped to exactly what a unit test **cannot** prove:

1. that a real click delivers a real file,
2. that a real browser renders that file with the network cut,
3. that the artifact is immune to a live mutation,
4. that the live auth gates hold on both the page and the route,
5. that the ratified "no sharing" scope has not silently grown a share button.

Everything else was Deferred **because it is already protected**, not because it does not matter. That distinction is recorded per row below.

## Candidates — created in Jira

| Test | Title | ROI | Priority | Covers ATP outlines |
|---|---|---|---|---|
| ***BK-331*** | TC01 — download carries the full chain, identity and timestamp | 20.0 | High | TC-BK50-01, 02, 12 |
| ***BK-332*** | TC02 — renders offline with zero external requests | 20.0 | Critical | TC-BK50-08 |
| ***BK-333*** | TC03 — snapshot survives a live mutation | 8.9 | Critical | TC-BK50-11 |
| ***BK-334*** | TC04 — unauthenticated browser redirects to login | 125.0 | Critical | TC-BK50-19 |
| ***BK-335*** | TC05 — unauthenticated API caller gets 401 | 125.0 | Critical | TC-BK50-20 |
| ***BK-336*** | TC06 — no hosted artifact, public link or share control | 18.0 | Medium | TC-BK50-21 |

All six are `Candidate` state, parented to BK-70, component `Coverage & Traceability`, and linked to BK-50 as "is tested by".

### Why TC01 merges three outlines

TC-BK50-01, 02 and 12 share one precondition (a story with a populated chain) and one action (trigger the export). Per the TC-identity rule, all expected results from the same precondition/action pair belong to **one** TC with multiple assertions. Splitting them into "check the chain / check the header / check the timestamp" is the anti-pattern the rule exists to prevent.

### Why TC04 and TC05 do NOT merge

Same precondition (no session), but different actions — navigating a page versus calling a route. They are enforced by different layers, and a regression in one would not surface in the other. Different action, different TC.

## Deferred — not created in Jira

| ATP outline | Reason |
|---|---|
| TC-BK50-03 (six run states) | Covered by `chain-view.test.ts` (19 tests, all six tone/label mappings). The export delegates to that same mapper, so an E2E duplicate tests the unit layer through a browser. |
| TC-BK50-04 (ATC under two ACs, no dedup) | Covered by `export-snapshot.test.ts` "has-chain story renders every AC/ATC/test/run/defect field" and by the BK-45 DB-integration isolation suite. |
| TC-BK50-05 (multiple defects listed) | Same unit test as above. |
| TC-BK50-06 (awaiting-data placeholder) | Covered by `export-snapshot.test.ts` zero-coverage and has-chain cases. |
| TC-BK50-07 (uncovered AC indicator) | Covered by `export-snapshot.test.ts` "zero-coverage story renders the uncovered banner and per-AC strip". |
| TC-BK50-09 (foreign-workspace rejection) | **Blocked, not covered.** No second workspace can be constructed — Settings → Members is still "Coming soon". The case is covered at DB-integration level by `story-traceability-isolation.test.ts` (11/11). **Revisit when Members ships**; this is the one Deferred row that is deferred for lack of capability, not redundancy. |
| TC-BK50-10 (nonexistent story, uniform 404) | Cheap and valuable, but the non-disclosure property is already asserted by the DB isolation suite, and TC05 exercises the same route's error envelope. Marginal addition. Revisit together with TC-09. |
| TC-BK50-13 (two exports in succession) | Low signal on its own; TC03 already performs two exports and asserts both. |
| TC-BK50-14 (same-minute filename collision) | **Documents behaviour BK-330 proposes to change.** A regression test written against today's minute granularity would need rewriting the moment BK-330 lands. Persist it *after* that decision, asserting whichever behaviour is ratified. |
| TC-BK50-15 (zero-AC prose) | Covered verbatim by `export-snapshot.test.ts` "zero-ac story renders prose stating no coverage as of the export timestamp (AC3.1)". |
| TC-BK50-16 (zero-coverage distinct from zero-AC) | Covered by the sibling unit test. |
| TC-BK50-17 (no-coverage prose carries the stamp) | Same unit test as TC-15. |
| TC-BK50-18 (survives source-story deletion) | True by construction and proven by TC02 — a document that issues zero requests cannot depend on the source story. TC02 is the stronger assertion; a separate delete-and-open case adds no coverage and would require destroying a fixture. |
| TC-BK50-22 (chain-assembly failure) | **Blocked.** SSR fetch runs server-side, outside browser-context interception; no fault-injection affordance exists. Same constraint as BK-45's TC-21. Tooling gap. |
| TC-BK50-23 (filename pattern) | Covered by four dedicated unit tests in `buildSnapshotFilename` (slugify, fallback, truncation, hyphen-boundary). TC01 additionally asserts the pattern as a secondary check. |
| TC-BK50-02, TC-BK50-12 | Merged into BK-331 rather than deferred — listed here for completeness of the 23. |

## Why the Manual bucket is empty

Nothing in this story requires human judgement. Every surviving scenario is a deterministic assertion over a downloaded file, an HTTP status, or the presence of a control — all mechanically checkable. Forcing a scenario into Manual to make the distribution look conventional would misrepresent the work. The bucket is empty on purpose.

## Traceability note — two shapes coexist in this project

BK-38 built its ATP and ATR as real `Test Plan` (BK-318) and `Test Execution` (BK-319) issues and linked its Tests to them via `Test Design` / `Test Execute`, with no Story link and no epic parent. BK-50 — like BK-45, BK-23 and BK-35 in this epic — keeps its ATP and ATR in Story custom fields, so its Tests link directly to the Story, which is the correct jira-native edge when no ATP/ATR issues exist.

Both shapes are individually defensible; having both in one project is not. Two follow-ups worth a decision, neither taken here because both reach beyond BK-50:

- Pick one ATP/ATR shape for the project and migrate the other.
- BK-38's Tests (BK-320..327) are unparented; BK-70 is an empty repository epic in practice until they are backfilled.

## Handoff to `/test-automation`

Six Candidates, re-scoped as **ticket-driven → Ticket (Medium)**. Suggested build order: TC04 and TC05 first (trivial, highest ROI, pure HTTP), then TC01, then TC02, then TC06, then TC03 last — it is the only one requiring a mutation and a mandatory teardown.

# DEFECT: Coverage & Traceability: Latest-run status pill shows "Aborted" — AC-01 (BK-45) specifies pass/fail/blocked/skipped

**Jira Key:** [BK-317](https://jira.upexgalaxy.com/browse/BK-317)
**Priority:** Low
**Status:** Ready For QA
**Components:** Coverage & Traceability

---

## Description

**SUMMARY**
On the TMS-Traceability chain view (BK-45), the latest-run status pill for an aborted run reads "Aborted". BK-45's AC-01 explicitly enumerates the four values a Test's latest-run status must render as: "pass/fail/blocked/skipped". "Aborted" is not one of the four — the shipped run-status vocabulary diverges from the literal, already-ratified AC text. No functional or security impact: the aborted run still renders as a visually distinct 4th terminal state, correctly excluded from pass/fail interpretation. This is a copy/vocabulary mismatch against a written acceptance criterion, not a missing feature.

---

**STEPS TO REPRODUCE**

#### Step 1 - Precondition
Workspace member (Owner role) authenticated on staging. Seeded story `d57804e8-d614-445e-b707-8c25d9ca5dac` ("As a QA reviewer, I want the full 5-layer evidence chain to render for a fully covered story") has an ATC whose latest Test run is in the Aborted state (one of its 3 seeded runs: Pass / Blocked / Aborted).

#### Step 2 - Navigation
Navigate to `/projects/{projectSlug}/traceability?story=d57804e8-d614-445e-b707-8c25d9ca5dac` on staging (`https://staging-upexbunkai.vercel.app`).

#### Step 3 - Action
Locate the ATC row bound to the aborted-run Test in the rendered chain.

#### Step 4 - Observe
The latest-run status pill for that row reads "Aborted".

---

**TECHNICAL ANALYSIS**

- **File****:** `components/traceability/TraceabilityChainView.tsx` (run-status pill rendering) — exact source line not inspected by QA, dev to confirm
- **Function****:** Run-status pill / terminal-status copy for the Test layer
- **Network****:** n/a — client-rendered status copy, not an API contract issue
- **Console****:** no errors observed

---

**IMPACT**

- Affects any story where a Test's latest run was aborted — copy/vocabulary only
- No misleading verdict: "Aborted" is still visually distinct from pass/fail/blocked, so there is no false-positive/false-negative risk
- No data-integrity or security impact
- Recommend aligning the shipped copy to AC-01's literal "skipped" wording, OR — PO/Dev call — rewording AC-01 to match the shipped "Aborted" vocabulary if that is the deliberate, existing app-wide term (Stage 2 exploration found no true internal "skipped" concept elsewhere in the app; aborting a run marks remaining steps as skipped internally, but the run-level pill reads "Aborted")

---

**RELATED STORIES**

- Related: BK-45
- Blocks: none — non-blocking finding, Story sign-off is not gated on this Defect

---

## Related Issues

- is caused by: [BK-45](https://jira.upexgalaxy.com/browse/BK-45) - TMS-Traceability | Render full US to bug evidence chain in one read

---

## Metadata

- **Created:** 8/8/2026
- **Updated:** 8/8/2026
- **Reporter:** Benjamin Segovia
- **Assignee:** Benjamin Segovia
- **Labels:** copy-mismatch, defect, exploratory-testing, traceability

---

_Synced from Jira by sync-jira-issues_

---

## QA Refinements (Shift-Left Analysis) — Added 2026-06-16

> Refined Acceptance Criteria live in the `acceptance_criteria` field (Step 1a).

### Edge Cases Identified

| # | Edge case | In original Story? | Criticality | Action |
|---|-----------|----------------------|---------------|--------|
| 1 | Exporting the same story twice in quick succession produces two independent snapshots (not deduplicated) | No | Low | Test only — don't add AC |
| 2 | Snapshot remains accessible after its source story is deleted/archived | No | High | Add to AC (PO confirm) |
| 3 | Export attempted on a story outside the requester's workspace (crafted ID) | No | High | Add to AC (PO confirm) — security-relevant |
| 4 | A defect linked in the snapshot is later merged/closed in the live system; snapshot must still show the original link | No | Medium | Add to AC (PO confirm) — direct test of the immutability promise |
| 5 | Snapshot format compatibility across future schema changes to the chain (forward-looking) | No | Low | Test only — don't add AC |
| 6 | Snapshot retrieval via a direct/guessed link by a user with no workspace access | No | High | Add to AC (PO confirm) — security-relevant, especially since the Story's stated goal is sharing with external parties |

### Clarified Business Rules

- "Read-only snapshot" (AC1) needs a confirmed artifact format — a downloadable file (PDF/JSON/HTML), a frozen in-app view, or both — before it can be implemented or tested; the user story's "without giving them system access" framing suggests a standalone file or unauthenticated share link rather than a logged-in view.
- "Snapshot reflects the moment of export" (AC2) needs a confirmed persistence mechanism — a deep copy of chain data stored at export time, or a generated static document inherently frozen by nature — since these carry different data models and different test designs.
- No AC currently defines who may trigger an export or who may later retrieve an already-exported snapshot, despite the Story's explicit goal of sharing snapshots with external auditors who have no system login.
- No AC currently defines snapshot storage/retention (in-app retrievable list vs one-time download) or behavior for very large chains (synchronous vs asynchronous export).

### Critical Questions for PO

1. **What artifact format does "export" produce — a downloadable file (PDF/JSON/HTML) the QA Lead can hand to someone with no system login, or an in-app read-only view still gated by authentication?**
   - **Context**: The user story explicitly says the goal is to "hand auditors and stakeholders a fixed record without giving them system access," which strongly implies a standalone file or an unauthenticated share link — but none of the 3 ACs say so explicitly, and AC1 only says "a read-only snapshot is produced."
   - **Impact if unanswered**: Cannot design the export action's UI/API contract, choose a persistence mechanism, or know whether access-control test cases for external (non-logged-in) viewers are in scope.
   - **Suggested answer (if you have one)**: Given the explicit "without giving them system access" framing, recommend a downloadable file (or a tokenized, unauthenticated share link with its own expiry) rather than an in-app view requiring login.

2. **What mechanism guarantees the snapshot reflects the moment of export (AC2) — a deep copy of all chain data stored at export time, or a generated static document that is inherently frozen by nature?**
   - **Context**: Phase 2 Ambiguity #3. These are fundamentally different engineering approaches with different data models, different test designs, and different answers to Edge Case #2 (does the snapshot survive deletion of the source story?) and Edge Case #4 (does a later defect merge leak into the snapshot?).
   - **Impact if unanswered**: The single most important AC in this Story (AC2, rated Critical priority) cannot be tested meaningfully without knowing which mechanism is used.
   - **Suggested answer (if you have one)**: A static, generated document (e.g. exported JSON or PDF) most naturally and cheaply satisfies "moment-in-time" immutability without needing a parallel versioned-copy data model — recommend this unless PO has a specific reason to need an in-app, re-browsable snapshot view.

3. **Who is allowed to trigger an export, and what access model governs who can later retrieve/view an already-exported snapshot (especially given that external auditors with no login are the Story's stated audience)?**
   - **Context**: Phase 2 Gap #2 and Edge Case #6. No AC defines a role gate on the export action itself, and the "external auditor" use case implies some access path exists outside normal in-app authentication.
   - **Impact if unanswered**: Cannot write authorization test cases for either the export action or the snapshot-retrieval path; a missing or misconfigured access gate on a shareable artifact is a direct data-leak vector (consistent with `master-test-plan.md`'s CRITICAL Tenancy risk, now extended to an artifact that leaves the system entirely).
   - **Suggested answer (if you have one)**: Restrict the export action to roles with read access to the user story (likely QA Lead and above); if external sharing is via a tokenized link, the token itself should be scoped, time-limited, and revocable.

### Technical Questions for Dev

1. **Will the export run synchronously (blocking the request/UI) or asynchronously (background job + "export ready" notification)?** — Context: Phase 2 Gap #3; the Epic's risk map already flags an N+1/performance risk at the chain-assembly layer (inherited from BK-45), and export adds a serialization step on top. Testing impact: determines whether a large-chain export is tested as a simple synchronous-response assertion or requires polling/notification-flow test design.

2. **If the snapshot is a DB-copy rather than a static file, what is the storage/retention policy — indefinite, time-limited, or subject to manual deletion by the QA Lead?** — Context: Phase 2 Gap #1; no AC addresses retention. Testing impact: determines whether "list past exports" and expiry/cleanup test outlines are in scope at all for v1.

3. **Does the export endpoint independently re-verify workspace/RLS scoping at generation time, or does it trust the caller's already-authenticated session context the same way the live chain view does?** — Context: Phase 2 Gap #4; an artifact that leaves the system is a higher-stakes surface for a missed RLS check than an in-app read, since there's no second chance to catch a leak after the file is downloaded. Testing impact: determines whether the export endpoint needs its own dedicated tenant-isolation test, separate from BK-45's.

> Full refinement (Phases 1-5, outline DRAFT, risk + data feasibility) lives in the ATP DRAFT custom field and the canonical comment below.

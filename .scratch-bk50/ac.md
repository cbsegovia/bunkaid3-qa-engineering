## Phase 3 — Refined Acceptance Criteria

### Original AC1 — Export an evidence chain

#### Scenario 1.1: Should produce a read-only snapshot containing the full assembled chain when the QA Lead exports a populated user story (Type: Positive, Priority: High)
- **NEEDS PO/DEV CONFIRMATION**: artifact format inferred — confirm before sprint planning
- **Given**: a user story with an assembled evidence chain (AC → ATC → Test → Run → Defect, mixed pass/fail)
- **When**: the QA Lead triggers the export action
- **Then**: a snapshot artifact is produced containing every chain entity and field visible on screen
  - UI: export action available on the chain view; success feedback shown (toast/download confirmation — exact copy TBD)
  - API: export endpoint returns either the file/document directly or a reference (URL/ID) to retrieve it; status 200/201
  - DB: a new persisted record representing the snapshot is created (if DB-copy approach) OR no DB write occurs and only a generated file is returned (if static-file approach) — mechanism TBD per Phase 2 Ambiguity #3
  - System state: live chain is unaffected by the export action (read-only, no mutation)

#### Scenario 1.2: Should reject export of a user story the requesting user has no read access to (Type: Negative, Priority: High)
- **NEEDS PO/DEV CONFIRMATION**: behavior inferred — confirm before sprint planning
- **Given**: a user story belonging to a different workspace than the requesting user's
- **When**: the user attempts to export it (e.g. via a crafted story ID)
- **Then**: the export is rejected with 403/404, no snapshot is created, no chain data is disclosed

### Original AC2 — Snapshot reflects the moment of export

#### Scenario 2.1: Should preserve the chain's state at export time when the live chain changes afterward (Type: Positive, Priority: Critical)
- **NEEDS PO/DEV CONFIRMATION**: mechanism inferred — confirm before sprint planning
- **Given**: a user story exported at time T0 with a specific chain state (e.g. AC-1 → Test-A → Run "pass")
- **When**: after export, the live chain changes (e.g. a new Run is added with verdict "fail", or an existing Defect is closed) and the QA Lead later opens the previously exported snapshot
- **Then**: the snapshot still displays the chain exactly as it was at T0, unaffected by the later changes
  - UI: snapshot view/file shows the T0 state, not the current live state
  - API: re-fetching the snapshot returns the same payload as at export time (byte-for-byte if file-based, or field-identical if DB-copy based)
  - DB: if DB-copy based, the snapshot's copied rows are verified to be independent of the live chain's rows (no shared foreign key that would let a live mutation cascade into the snapshot)
  - System state: live chain reflects the new state; snapshot is unaffected

### Original AC3 — Export an empty chain

#### Scenario 3.1: Should produce a snapshot stating the story had no coverage when exporting a story with zero chain entities (Type: Negative/Edge, Priority: High)
- **NEEDS PO/DEV CONFIRMATION**: exact copy inferred — confirm before sprint planning
- **Given**: a user story with no ACs, ATCs, Tests, Runs, or Defects (zero coverage, consistent with BK-45's "no coverage" empty state)
- **When**: the QA Lead exports it
- **Then**: a snapshot artifact is produced stating the story had no coverage as of the export timestamp (exact copy TBD)
  - UI/file: empty-state message embedded in the snapshot itself, distinct from a normal export — not an error
  - API: 200/201, snapshot created/returned normally (this is a valid export outcome, not a failure)
  - DB: same persistence behavior as Scenario 1.1, with an empty payload
  - System state: unaffected

### New scenarios surfaced from Phase 2 edge cases — NEEDS PO/DEV CONFIRMATION

#### Scenario E1: Should keep a previously exported snapshot accessible and unaffected after its source user story is deleted or archived (Type: Edge, Priority: High)
- **NEEDS PO/DEV CONFIRMATION**: behavior inferred — confirm before sprint planning
- **Given**: a snapshot exported from user story X, which is later deleted/archived
- **When**: the QA Lead (or an auditor holding the snapshot) opens the previously exported snapshot
- **Then**: TBD — either the snapshot remains fully viewable as a standalone artifact, or it becomes inaccessible (would break AC2's immutability promise if so)

#### Scenario E2: Should reject an unauthenticated/unauthorized attempt to re-open or download a snapshot via direct link (Type: Negative, Priority: High)
- **NEEDS PO/DEV CONFIRMATION**: behavior inferred — confirm before sprint planning
- **Given**: a snapshot exists, and its retrieval URL/ID is known or guessed by a user without access to the original story's workspace
- **When**: that user attempts to retrieve the snapshot
- **Then**: TBD — access is rejected (403/404), consistent with the master test plan's CRITICAL tenant-isolation concern; this is especially important given the Story's explicit goal of handing snapshots to EXTERNAL auditors, which implies some access path exists outside normal in-app authentication

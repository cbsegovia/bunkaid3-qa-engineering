# ADR — Architecture Decision Records (test architecture)

> "Architecture" here means **test architecture** — test-suite structure, runner/fixture/isolation
> choices, cache/traceability policy — not product architecture. A wrong test-architecture call is
> among the most expensive things to reverse: you rewrite the suite. This folder is the append-only,
> permanent record of those decisions.

## What is an ADR

A short markdown file capturing one architectural test-suite decision: the context that forced it,
the decision itself, its consequences (positive **and** negative), and the alternatives that were
rejected. Full detection heuristic and authoring procedure:
`.claude/skills/agentic-qa-core/references/adr-doctrine.md`.

## When to write one

A decision earns an ADR only when it passes **both** gates:

1. **Architectural** — a cross-cutting test-suite concern (runner, fixtures, isolation, cache
   policy, traceability model), not a ticket-local choice.
2. **Hard to reverse** — reversing it means rewriting many tests, migrating fixtures/data, or
   coordinating across the QA team.

Fails either gate → it is not an ADR. Ticket-local decisions stay in the ticket's
`acceptance-test-planning.md` / automation plan under `## Technical Decisions`.

## Naming convention

`ADR-NNNN-<slug>.md` — 4-digit zero-padded sequence number, never reused (even when an ADR is
superseded), + a short kebab-case slug summarizing the decision. Example:
`ADR-0001-adopt-pbi-cache-and-ats-doctrine.md`.

The **Index** table below is the only allocator. To number a new ADR: read this table,
take `max(existing NNNN) + 1`.

## Lifecycle

```
Proposed ──(human approves)──▶ Accepted ──(later decision reverses/replaces)──▶ Superseded by ADR-NNNN
```

- **Proposed** — AI-drafted, open question remaining. Default status on creation.
- **Accepted** — agreed and binding, **only after explicit human sign-off**. An AI workflow drafts;
  the human accepts. Never self-promote a draft to `Accepted`.
- **Superseded** — a later ADR reverses or replaces this one. Flip this ADR's `Status` line to
  `Superseded by ADR-NNNN`; wire the new ADR's front matter back with `Supersedes: ADR-NNNN`.

**Append-only — never delete or rewrite a recorded decision's body.** Correcting or reversing a
decision means writing a *new* ADR that supersedes the old one. The old file stays as history,
verbatim, forever.

## Index

| Number | Title | Status | Date |
|---|---|---|---|
| ADR-0001 | Adopt PBI-as-cache tiering and ATS-primary traceability cascade | Proposed | 2026-08-21 |

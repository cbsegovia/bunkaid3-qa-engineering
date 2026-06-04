# BUNKAI TMS — Master Test Plan

+-----------------------------------------------------------------------+
|                             BUNKAI TMS                                |
|           Master Test Plan — What to Test, and Why It Matters        |
+-----------------------------------------------------------------------+

## Executive Risk Map

Bunkai TMS is the core operating system for testing repositories, meaning bugs in this application immediately impact the development speed and verification of all other product teams. This plan structures Bunkai's most critical operational paths.

| Priority | Flow | Why it matters | Depends on / Affects |
|---|---|---|---|
| **CRITICAL** | **Authentication & Tenancy** | Controls access boundaries; tenant isolation leaks can lead to cross-customer data leakage. | Everything gated by login |
| **CRITICAL** | **Module Hierarchy & Depth** | Represents the core organization tree. Corruption renders the repository navigation impossible. | Stories, ACs, ATCs |
| **HIGH** | **User Story & AC Sync** | Synchronization with Jira is the single source of truth for requirements. Traceability failure results in compliance gaps. | Jira Integration |
| **HIGH** | **ATC Authoring & Cascades**| Cascading updates to reusable components (ATCs) must propagate safely without breaking existing tests. | Chained Tests |

---

## What to Test First and Why

### 1. Authentication & Tenancy
* **Why it matters**: Bunkai is a multi-tenant platform. Tenancy isolation is paramount.
* **What commonly breaks**: Magic-link expiration limits, OAuth callback token exchanges, session cookie attributes in different environments.
* **What to check**:
  - Enforce RFC 5321 length limits on email inputs (254-character maximum).
  - Verify tokens expire exactly at 15 minutes (`auth.otp_exp = 900`).
  - Verify redirection to onboarding on first-time login, or straight to projects for returning users.
  - Verify that a workspace member from Workspace A cannot query projects from Workspace B (RLS enforcement).

### 2. Module Hierarchy & Max Depth (BK-9, BK-11)
* **Why it matters**: Mapped directly to the self-referential tree structure. If the path or nesting depth breaks, the UI tree breaks, preventing QA Engineers from navigating their workspace.
* **What commonly breaks**:
  - Nesting beyond the absolute limit of 6 levels (must be blocked).
  - Breadcrumb calculation on nested levels.
  - Soft warning rendering when nesting at level 4 or deeper.
  - Moving a module (BK-11) to a different parent (validating cycle checks and parent path recalculation).
* **What to check**:
  - Validate depth constraint of `1..6` inclusive in the database `path` column.
  - Verify warning fires at depth 4, 5, 6 but allows creation.
  - Verify attempt to create at depth 7 is rejected with a clear message.
  - Verify unique module names inside the same project.

---

## State Machines That Matter

### User Story Lifecycle
* **Why it matters**: Stories must flow deterministically through quality gates.
* **Transitions at risk**: `backlog -> shift_left_qa -> estimation`.
* **Verification**:
  - Verify stories cannot be transitioned to `Estimation` without a populated ATP (Acceptance Test Plan) DRAFT.
  - Verify the label `shift-left-reviewed` is applied to stories during refinement.

---

## Silent Killers — Automated Processes

### DB RLS & Workspace Scoping
- **What it does**: Checks user memberships on every database mutation.
- **Risk**: Since next.js server components bypass RLS when using the service role, any developer omission when instantiating the supabase client could lead to cross-workspace reads/writes.
- **Verification**: Always verify RLS is enabled and active in tests, especially around projects and modules creation.

---

## External Integrations — Failure Points

### Jira Integration
- **Impact**: Syncing issues is critical. If the Jira API is down, synchronization fails.
- **Quirks**: Eventual consistency of Jira, and the conversion from Markdown to Atlassian Document Format (ADF) on story updates.
- **Verification**: Verify that invalid HTML/ADF payloads do not crash the syncing pipeline and are caught gracefully.

---

## Dependency Cascade Between Flows

```
  Workspace ──► Project ──► Modules ──► User Stories ──► ACs ──► ATCs ──► Test Chains
      │            │           │              │             │          │           │
      └ Fails here = no projects, no modules can be created, rendering the entire TMS useless.
```

---

## Pre-Release Checklist

1. Verify email validation accepts only valid RFC 5321 email format.
2. Verify token replay on magic link is blocked and shows `TOKEN_USED`.
3. Verify top-level module can be created at project root.
4. Verify sub-module can be nested under an existing module.
5. Verify maximum nesting depth is strictly enforced at 6 levels.
6. Verify soft depth warning displays at level 4 and 5.
7. Verify moving a module recalculates its path and all children's paths.
8. Verify unique constraints on project slugs and module paths are active.

---

## What is NOT in this Plan

- Detailed Gherkin scenarios for each individual ticket (lives under PBI folder).
- DB migrations or schemas (maintained under `supabase/migrations/`).

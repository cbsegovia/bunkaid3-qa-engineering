# BUNKAI TMS — Business Data Map

+-----------------------------------------------------------------------+
|                             BUNKAI TMS                                |
|             Autonomous Test Management & Quality Engineering          |
+-----------------------------------------------------------------------+

## Executive Summary

Bunkai TMS is an advanced, autonomous Test Management System designed to bridge the gap between business requirements (User Stories & Acceptance Criteria) and automated quality verification. Bunkai organizes test suites structurally via nested modules mirroring the actual application under test, allows authoring reusable Atomic Test Components (ATCs), and tracks execution runs and defect tracking.

### Actors Model
```
  [ Senior QA Engineer ] -------> Manage Projects, Modules, User Stories, ATCs, and Test Runs
          |
          v
  [ QA Automation Eng ]  -------> Author automated test chains & execute scripts
          |
          v
  [ Product Owner ]      -------> Refine ACs, estimate stories, and review defect heatmaps
```

---

## Entity Map

```
  +------------------+
  |    Workspaces    |
  +------------------+
           | 1
           |
           | 1..*
  +------------------+
  |     Projects     |
  +------------------+
           | 1
           |
           | 0..*
  +------------------+         0..1
  |     Modules      | <------------------+
  +------------------+ (Self-ref parent)  |
           | 1                            |
           |                              |
           | 0..*                         |
  +------------------+                    |
  |   User Stories   |                    |
  +------------------+                    |
           | 1                            |
           |                              |
           | 0..*                         |
  +------------------+                    | 0..*
  |  Acceptance Crit |                    |
  +------------------+                    |
                                          |
  +------------------+                    |
  |       ATCs       | -------------------+
  +------------------+ (Also belongs to Module)
```

### Core Entities

| Entity | Database Table | Business Role | Why it exists |
|---|---|---|---|
| **Workspace** | `public.workspaces` | Multi-tenant Boundary | Encapsulates projects, users, memberships, and billing boundaries. |
| **Project** | `public.projects` | Test Repository Container | Groups nested modules, user stories, ATCs, and test suites. |
| **Module** | `public.modules` | Hierarchical Suite Node | Structural folders to organize the test suite. Self-referential tree structure (max depth 6). |
| **User Story** | `public.user_stories` | Functional Specification | Records features under test, anchored to a specific Module. |
| **Acceptance Criterion** | `public.acceptance_criteria` | Verifiable Boundary | Assertions (Gherkin or plain text) validating story compliance. |
| **ATC** | `public.atcs` | Reusable Action Blocks | Atomic Test Components representing granular UI/API/DB actions. |

---

## Business Flows

### 1. Project & Module Setup Flow
```
  [Senior QA Engineer] -> Creates Module -> Resolves Path -> Inserts public.modules
```
1. Elena opens a **Project** and requests to create a new Module (e.g., `"Payment"`).
2. The system checks if `"Payment"` exists at the root path of the project.
3. On save, the row is inserted with `parent_module_id = null` and `path = 'Payment'`.
4. Elena creates a sub-module `"Refunds"` nested under `"Payment"`.
5. The system sets `parent_module_id` to the ID of `"Payment"` and computes `path = 'Payment/Refunds'`.
6. The `modules_path_depth_max_6` check constraint ensures that the count of segments split by `/` is $\le 6$.

### 2. User Story & AC Anchoring Flow
1. Product Owner or QA Engineer creates a **User Story** (e.g., `"BK-9"`) and anchors it to the `"Payment"` module.
2. The user story contains description, priority, and epic linkage.
3. Under the story, they author multiple **Acceptance Criteria** (ACs) containing Given-When-Then statements.
4. Each AC has a relative `position` integer for ordering.

---

## State Machines

### 1. User Story Lifecycle
```
  [ Backlog ] --(Analyze)--> [ Shift-Left QA ] --(Estimate)--> [ Estimation ] --(Ready to Work)--> [ Ready For Dev ]
```
* **Backlog**: New stories drafted by the Product Owner.
* **Shift-Left QA**: Story under review by QA to refine ACs, discover edge cases, and raise clarity questions.
* **Estimation**: Refined story ready for developer and PO estimations.
* **Ready For Dev**: Story committed to development sprint.

---

## Automatic Processes

### DB Triggers & RLS Helpers
- **RLS Policies**: Restrict selects and mutations on `projects`, `modules`, `user_stories`, and `atcs` based on user membership and active status in the owning workspace (`workspace_members`).

---

## Discovery Gaps

- **Module path automatic derivation**: The database schema enforces a unique constraint on `(project_id, path)` and a depth constraint on `path`, but the trigger or logic that automatically concatenates and updates the `path` dynamically when a parent is changed is not defined in database migrations. This implies it is managed in the application layer (Next.js server-side) or will be added.

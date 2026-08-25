/**
 * KATA Architecture - BK-45 Traceability Non-Disclosure Guard
 *
 * BK-448 (TC16): a foreign-workspace story and a nonexistent story ID must
 * both resolve to the SAME uniform not-found state, with zero chain data
 * (AC/ATC/Test/Run/Defect) ever leaking into the DOM.
 *
 * Project: bk-45-traceability-fixtures (workspace's only reachable project
 * for the qa3 test identity as of 2026-08-25).
 */

import { randomUUID } from 'node:crypto';

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';

test.describe('BK-45: Traceability non-disclosure guard', () => {
  test('BK-448: should return the uniform not-found state for a nonexistent story ID', async ({ ui }) => {
    await ui.traceability.expectNonDisclosureNotFound({
      projectSlug: FIXTURE_PROJECT_SLUG,
      targetStoryId: randomUUID(),
    });
  });

  // PARKED — re-confirmed BLOCKED live on 2026-08-25, but for a DIFFERENT
  // exact reason than originally recorded. `qa3` now owns its own workspace
  // ("QA Automation Workspace" / bk-45-traceability-fixtures), which made it
  // seem like a second, foreign workspace finally existed to test against.
  // It does — but the legacy project that would supply a real foreign story
  // (`bk-23-test-project`, the OLD workspace's only project) is itself
  // unreachable to `qa3`: navigating to `/projects/bk-23-test-project` (with
  // or without a `/traceability?story=` suffix) renders the Next.js
  // app-shell "404: This page could not be found." BEFORE the traceability
  // route/component ever mounts — confirmed live, no `workbench-not-found`
  // or any traceability testid present, only the bare app-shell 404. `qa3`
  // has exactly one reachable project, so any story ID probed against it is
  // a same-project mismatch (already covered by the nonexistent-ID case
  // above and by `TraceabilityApi.expectMismatchedPairNotFound`,
  // `@atc('BK-109')`), never a genuine cross-workspace case. Un-park once a
  // second WORKSPACE with a reachable project (not just a reachable
  // account) exists on staging. See spec.md "Blockers" + BK-50 TC-BK50-09.
  test.fixme('BK-448: should return the uniform not-found state for a foreign-workspace story', async ({ ui }) => {
    await ui.traceability.expectNonDisclosureNotFound({
      projectSlug: FIXTURE_PROJECT_SLUG,
      targetStoryId: '/* real story ID from a reachable foreign workspace - not constructible today */',
    });
  });
});

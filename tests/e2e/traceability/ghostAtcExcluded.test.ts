/**
 * KATA Architecture - BK-45 Traceability Ghost-ATC Exclusion Guard
 *
 * BK-450 (TC18): an ATC whose own `archived_at` is null, but whose ancestor
 * module was archived via the real module-subtree archive endpoint, must be
 * excluded from the chain as a "ghost" - a named EC7 error-guessing
 * regression class for a naive same-row-only archival filter.
 *
 * Fixture story (seeded 2026-08-25 via the real archive endpoints, shared
 * with BK-449 - do not mutate its AC/ATC shape): workspace
 * "QA Automation Workspace", project `bk-45-traceability-fixtures`, story
 * "QA Fixture: archival exclusion (BK-449/BK-450)". The ghost ATC lived in
 * the descendant module `bk-45-fixtures/ghost-sub`, archived via
 * `DELETE /v1/modules/{id}` after creation.
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'f7a0f4d8-cb40-4643-9233-289b90a6a6dd';
const GHOST_ATC_TITLE = 'Ghost ATC - ancestor module will be archived (BK-450)';

test.describe('BK-45: Traceability ghost-ATC exclusion guard', () => {
  test('BK-450: should exclude a ghost ATC whose ancestor module was archived, given archived_at is null on the ATC', async ({ ui }) => {
    await ui.traceability.expectGhostAtcExcluded({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      ghostAtcTitle: GHOST_ATC_TITLE,
    });
  });
});

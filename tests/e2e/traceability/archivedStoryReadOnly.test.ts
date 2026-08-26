/**
 * KATA Architecture - BK-45 Traceability Archived-Story Read-Only Guard
 *
 * BK-451 (TC19): a story whose `archived_at` is set must render its chain
 * read-only with an "archived" banner - a 200, not a 404 - distinct from
 * TC-BK45-16's uniform non-disclosure case for foreign/nonexistent stories.
 *
 * Fixture story (seeded 2026-08-25 via the real `DELETE /v1/user-stories/{id}`
 * archive endpoint - the TC's originally-documented fixture returns 404
 * today): workspace "QA Automation Workspace", project
 * `bk-45-traceability-fixtures`, story "QA Fixture: archived story read-only
 * banner (BK-451)".
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = '31818967-f715-465c-bdb1-ac8168fa3919';

test.describe('BK-45: Traceability archived-story read-only guard', () => {
  test('BK-451: should render an archived Story\'s chain read-only with an archived banner, not a 404', async ({ ui }) => {
    await ui.traceability.expectArchivedStoryRendersReadOnly({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
    });
  });
});

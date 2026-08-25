/**
 * KATA Architecture - BK-45 Traceability Zero-AC Authoring-Gap Guard
 *
 * BK-446 (TC13): a story with zero acceptance criteria must show the
 * "No acceptance criteria yet" authoring-gap copy, distinct from the AC-03
 * "No coverage anywhere on this story" banner.
 *
 * Fixture story (seeded 2026-08-25 via the real API - the TC's originally-
 * documented fixture returns 404 today, same unreachable-legacy-fixture
 * class as BK-453/BK-451): workspace "QA Automation Workspace", project
 * `bk-45-traceability-fixtures`, story "QA Fixture: zero ACs authoring-gap
 * copy (BK-446)".
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'd5497fec-e82f-4c52-8e83-8194a58ae097';

test.describe('BK-45: Traceability zero-AC authoring-gap guard', () => {
  test('BK-446: should show "No acceptance criteria yet" for a story with zero ACs, distinct from AC-03 copy', async ({ ui }) => {
    await ui.traceability.expectZeroAcAuthoringGap({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
    });
  });
});

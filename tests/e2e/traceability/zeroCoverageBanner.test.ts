/**
 * KATA Architecture - BK-45 Traceability Zero-Coverage Banner Guard
 *
 * BK-464 (TC12): a story with 1+ acceptance criteria, none of which has an
 * ATC bound, must show the distinct "No coverage anywhere on this story"
 * banner - never a blank screen, spinner, or placeholder - and each
 * individual AC row must still render its own uncovered strip.
 *
 * Fixture story (seeded 2026-08-25 via the real API - the TC's originally-
 * documented fixture returns 404 today): workspace "QA Automation
 * Workspace", project `bk-45-traceability-fixtures`, story "QA Fixture:
 * zero coverage anywhere (BK-464)".
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'c4a5b720-237f-4a0a-b7e3-3b8addf1f861';

test.describe('BK-45: Traceability zero-coverage banner guard', () => {
  test('BK-464: should show "No coverage anywhere on this story" given a story with ACs but zero ATCs bound', async ({ ui }) => {
    await ui.traceability.expectZeroCoverageBannerRenders({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
    });
  });
});

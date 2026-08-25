/**
 * KATA Architecture - BK-45 Traceability Cross-Story Defect-Leak Guard
 *
 * BK-460 (TC08, HIGH severity): a defect belonging to a DIFFERENT story's
 * ATC must never leak into this story's chain, even when the underlying
 * Test/Run row is genuinely shared across both stories. This is the ATP's
 * dominant security risk item - defects are scoped via `bugs.atc_id`, not
 * `run_id`, specifically to prevent this class of cross-story data
 * disclosure.
 *
 * Fixture (seeded 2026-08-25 via the real Test/Run/bug-filing API - the
 * TC's originally-documented BK-35 fixture returns 404 today): workspace
 * "QA Automation Workspace", project `bk-45-traceability-fixtures`, two
 * stories - "QA Fixture: cross-story defect-leak guard - Story X (BK-460)"
 * (this story) and "... - Story Y foreign (BK-460)" - each with its own
 * ATC, both chained into ONE shared Test/Run. Story Y's ATC step was marked
 * failed and carries a defect; Story X's own step was marked passed.
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const STORY_X_ID = 'acc2652e-bf29-4f28-9cd3-3d68ebd20989';
const OWN_ATC_ID = '8e0d8d3b-eb11-4c46-a72c-b8546f7b835e';
const FOREIGN_DEFECT_TITLE = 'Foreign defect - must never leak into Story X (BK-460)';

test.describe('BK-45: Traceability cross-story defect-leak guard', () => {
  test('BK-460: should not show a defect belonging to a different story\'s ATC even when sharing a Test/Run', async ({ ui }) => {
    await ui.traceability.expectSharedRunHidesForeignDefect({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: STORY_X_ID,
      ownAtcId: OWN_ATC_ID,
      foreignDefectTitle: FOREIGN_DEFECT_TITLE,
    });
  });
});

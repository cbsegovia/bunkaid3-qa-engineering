/**
 * KATA Architecture - BK-45 Traceability Multi-Defect Ordering Guard
 *
 * BK-459 (TC07): multiple defects linked to one Run must render in
 * `created_at DESC` order - a reviewer scanning the chain expects the most
 * recent defect status first.
 *
 * Fixture story (seeded 2026-08-25 via the real Run + run-linked bug-filing
 * API - the TC's originally-documented BK-35 fixture returns 404 today):
 * workspace "QA Automation Workspace", project `bk-45-traceability-fixtures`,
 * story "QA Fixture: multiple defects ordering (BK-459)". Two bugs filed
 * ~18s apart against the same failed run step.
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'a4f9ca0f-8eba-4a54-b4de-15203bfc3069';
const ATC_ID = 'c242beda-5edf-431f-8868-0e8c66185364';
const NEWEST_DEFECT_TITLE = 'Second bug filed - should render first (newest)';
const OLDEST_DEFECT_TITLE = 'First bug filed - should render second (older)';

test.describe('BK-45: Traceability multi-defect ordering guard', () => {
  test('BK-459: should list and order multiple defects linked to one run by created_at DESC', async ({ ui }) => {
    await ui.traceability.expectDefectsOrderedNewestFirst({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      atcId: ATC_ID,
      newestDefectTitle: NEWEST_DEFECT_TITLE,
      oldestDefectTitle: OLDEST_DEFECT_TITLE,
    });
  });
});

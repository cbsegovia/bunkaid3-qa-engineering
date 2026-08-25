/**
 * KATA Architecture - BK-45 Traceability Archived-AC Exclusion Guard
 *
 * BK-449 (TC17): a story with one active AC (1 bound ATC) and one archived
 * AC (1 bound ATC) must render only the active pair - the archived AC and
 * its ATC must be fully absent from the chain view.
 *
 * Fixture story (seeded 2026-08-25 via the real archive endpoints, shared
 * with BK-450 - do not mutate its AC/ATC shape): workspace
 * "QA Automation Workspace", project `bk-45-traceability-fixtures`, story
 * "QA Fixture: archival exclusion (BK-449/BK-450)".
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'f7a0f4d8-cb40-4643-9233-289b90a6a6dd';
const ARCHIVED_AC_TITLE = 'Archived AC - must vanish (BK-449)';
const ARCHIVED_ATC_TITLE = 'ATC bound to the AC that will be archived';

test.describe('BK-45: Traceability archived-AC exclusion guard', () => {
  test('BK-449: should exclude an archived AC and its archived ATC from the chain', async ({ ui }) => {
    await ui.traceability.expectArchivedAcExcluded({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      archivedAcTitle: ARCHIVED_AC_TITLE,
      archivedAtcTitle: ARCHIVED_ATC_TITLE,
    });
  });
});

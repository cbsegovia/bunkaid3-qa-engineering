/**
 * KATA Architecture - BK-45 Traceability ATC No-Dedup-Across-ACs Guard
 *
 * BK-455 (TC25): a single ATC bound to two acceptance criteria on the same
 * story must repeat its chain segment under EACH bound AC, never
 * deduplicated or collapsed to a single appearance (EP / A5+EC3 "no ATC
 * dedup across ACs" ruling).
 *
 * Fixture story (seeded 2026-08-25 via the real API): workspace
 * "QA Automation Workspace", project `bk-45-traceability-fixtures`, story
 * "QA Fixture: ATC bound to two ACs (BK-455)".
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = '16117ac2-8d12-417d-a4f9-c412804bcc44';
const SHARED_ATC_ID = '47cf4a40-589d-4316-8d3e-6a52e0149a1d';

test.describe('BK-45: Traceability ATC no-dedup-across-ACs guard', () => {
  test('BK-455: should repeat an ATC\'s chain segment under each bound AC given the ATC is bound to 2+ ACs on the same story', async ({ ui }) => {
    await ui.traceability.expectAtcRepeatsUnderEachBoundAc({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      sharedAtcId: SHARED_ATC_ID,
    });
  });
});

/**
 * KATA Architecture - BK-45 Traceability Full Chain Render
 *
 * BK-445 (TC01): a story with every AC bound through AC -> ATC -> Test ->
 * Run -> Defect must render the full 5-layer chain on a single page load,
 * with no broken/null cells.
 *
 * Fixture story (seeded specifically for this purpose - do not mutate its
 * chain shape; other BK-45 TCs may come to depend on it staying as-is):
 * workspace "QA Automation Workspace", project `bk-45-traceability-fixtures`,
 * story "QA Fixture: full coverage story for BK-45 automation"
 * (1 AC -> 1 ATC -> 1 Test -> 1 Run (Failed) -> 1 Defect).
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'cb997c18-3b51-45e3-8a16-84d7aa3bd222';

test.describe('BK-45: Traceability full chain render', () => {
  test('BK-445: should render the full 5-layer chain when a story has complete AC-ATC-Test-Run-Defect coverage', async ({ ui }) => {
    await ui.traceability.expectChainRenders({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
    });
  });
});

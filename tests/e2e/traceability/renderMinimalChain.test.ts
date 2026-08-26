/**
 * KATA Architecture - BK-45 Traceability Minimal Chain Render
 *
 * BK-456 (TC02): the lower Boundary Value Analysis case for chain-depth
 * rendering - a story whose chain depth is exactly 1 at every layer through
 * Run (1 AC -> 1 ATC -> 1 Test -> 1 Run) must still render exactly one row
 * per layer, not a zero-row false-empty state and not a duplicated row.
 *
 * Fixture story (reused verbatim from BK-445 - do not mutate its chain
 * shape; other BK-45 TCs may come to depend on it staying as-is):
 * workspace "QA Automation Workspace", project `bk-45-traceability-fixtures`,
 * story "QA Fixture: full coverage story for BK-45 automation"
 * (1 AC -> 1 ATC -> 1 Test -> 1 Run (Failed) -> 1 Defect - the extra Defect
 * layer is outside this TC's Given/Then scope and does not disqualify reuse).
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'cb997c18-3b51-45e3-8a16-84d7aa3bd222';

test.describe('BK-45: Traceability minimal chain render', () => {
  test('BK-456: should render the minimum populated chain when a story has exactly 1 AC, 1 ATC, 1 Test and 1 Run', async ({ ui }) => {
    await ui.traceability.expectMinimalChainRenders({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
    });
  });
});

/**
 * KATA Architecture - BK-45 Traceability Mixed-Coverage Guard
 *
 * BK-462 (TC10) and BK-463 (TC11): a story with 1+ covered ACs and 1+ AC
 * with zero bound ATCs must render the uncovered strip as a well-formed
 * row (BK-462), and both covered/uncovered states must render correctly
 * side by side with no state bleeding between AC cards (BK-463) - the
 * ATP's explicitly flagged untested residual before this pass.
 *
 * Fixture story (seeded 2026-08-25 via the real API, shared by both TCs -
 * the TC's originally-documented fixture, BK-35's story, returns 404
 * today): workspace "QA Automation Workspace", project
 * `bk-45-traceability-fixtures`, story "QA Fixture: mixed AC coverage
 * (BK-462/BK-463)".
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'fb18b211-913a-4319-a8c7-77dd640c0a9f';
const COVERED_AC_TITLE = 'Covered AC - has an ATC';
const UNCOVERED_AC_TITLE = 'Uncovered AC - zero ATCs bound';

test.describe('BK-45: Traceability mixed-coverage guard', () => {
  test('BK-462: should show the Uncovered · 0 ATCs bound strip for an AC with no ATCs', async ({ ui }) => {
    await ui.traceability.expectUncoveredStripForZeroAtcAc({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      uncoveredAcTitle: UNCOVERED_AC_TITLE,
    });
  });

  test('BK-463: should render a mixed story correctly given some ACs full chain and some uncovered', async ({ ui }) => {
    await ui.traceability.expectMixedCoverageRendersSideBySide({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
      coveredAcTitle: COVERED_AC_TITLE,
      uncoveredAcTitle: UNCOVERED_AC_TITLE,
    });
  });
});

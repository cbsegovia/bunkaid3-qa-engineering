/**
 * KATA Architecture - BK-45 Traceability Layer-Gap Copy Guard
 *
 * BK-461 (TC09): an ATC missing a downstream layer (no Test chained, a Test
 * with zero Runs ever started, or a Run with zero linked Defects) must show
 * the exact layer-specific "awaiting data" copy in the relevant cell(s) -
 * never a null or blank cell, and never the wrong layer's copy.
 *
 * SCOPE CORRECTION (2026-08-25): the TC's Jira Examples table listed 5 rows
 * under one ambiguous "missing_layer" label, 3 of which all said "Run" with
 * 3 different copies. Confirmed live against staging (see
 * `TraceabilityPage.expectLayerGapCopy`'s docblock) that this was a
 * mislabeling of which CELL each copy belongs to, not a real product
 * ambiguity - reduces to exactly 3 well-formed preconditions, reusing
 * already-seeded ATCs from earlier BK-45 fixtures rather than seeding new
 * ones:
 * - No Test chained: `ATC bound to the covered AC` (BK-462/BK-463's story).
 * - A Test chained, zero Runs ever: a dedicated throwaway ATC seeded on the
 *   run-status pill matrix story (BK-457/BK-458).
 * - A Run with zero linked Defects: Story X's own ATC in the cross-story
 *   defect-leak fixture (BK-460) - its own step passed, "None linked".
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';

test.describe('BK-45: Traceability layer-gap copy guard', () => {
  test('BK-461: should show "No test written yet" / "Awaiting test" when an ATC has no Test chained', async ({ ui }) => {
    await ui.traceability.expectLayerGapCopy({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: 'fb18b211-913a-4319-a8c7-77dd640c0a9f',
      atcId: '3584e1c0-c0cb-4750-b831-72b6addc8987',
      expectedTestCopy: 'No test written yet',
      expectedRunCopy: 'Awaiting test',
      expectedDefectCopy: 'Awaiting test',
    });
  });

  test('BK-461: should show "No run recorded yet" / "Awaiting first run" when a Test is chained but zero Runs ever started', async ({ ui }) => {
    await ui.traceability.expectLayerGapCopy({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: '75eebe7a-bc46-48c8-8dd0-fe82306e6dec',
      atcId: 'bbd95060-7669-4cff-b62d-4a1e6feba391',
      expectedRunCopy: 'No run recorded yet',
      expectedDefectCopy: 'Awaiting first run',
    });
  });

  test('BK-461: should show "None linked" when a Run exists with zero linked Defects', async ({ ui }) => {
    await ui.traceability.expectLayerGapCopy({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: 'acc2652e-bf29-4f28-9cd3-3d68ebd20989',
      atcId: '8e0d8d3b-eb11-4c46-a72c-b8546f7b835e',
      expectedDefectCopy: 'None linked',
    });
  });
});

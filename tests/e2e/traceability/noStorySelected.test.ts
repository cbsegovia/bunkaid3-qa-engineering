/**
 * KATA Architecture - BK-45 Traceability Screen Entry-State Guard
 *
 * BK-453 (TC23): hitting the traceability route with the `story` query
 * param entirely absent must render the "select a user story" prompt, never
 * the chain view, and never attempt the chain-fetch request. No story / AC /
 * ATC / Test / Run / Defect data precondition — authenticated session only.
 *
 * Project: bk-23-test-project (workspace's only project — same slug BK-50's
 * traceability access tests already resolved to).
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-23-test-project';

test.describe('BK-45: Traceability screen entry-state guard', () => {
  test('BK-453: should render the select a user story prompt when no story query param is present', async ({ ui }) => {
    await ui.traceability.expectNoStorySelectedPrompt(FIXTURE_PROJECT_SLUG);
  });
});

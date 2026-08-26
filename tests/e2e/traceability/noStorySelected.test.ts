/**
 * KATA Architecture - BK-45 Traceability Screen Entry-State Guard
 *
 * BK-453 (TC23): hitting the traceability route with the `story` query
 * param entirely absent must render the "select a user story" prompt, never
 * the chain view, and never attempt the chain-fetch request. No story / AC /
 * ATC / Test / Run / Defect data precondition — authenticated session only.
 *
 * Project: bk-45-traceability-fixtures — the workspace/project seeded for
 * BK-445 (see tests/components/ui/TraceabilityPage.ts docblock). The old
 * `bk-23-test-project` slug lived in a workspace the .env test account
 * (bunkai-staging-qa3@...) no longer has access to — confirmed unreachable
 * (full Next.js 404 before the traceability route mounts), same root cause
 * documented for BK-448's Row 1. This scenario needs no story/AC/ATC/Test/
 * Run/Defect data, so any project the account can reach works.
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';

test.describe('BK-45: Traceability screen entry-state guard', () => {
  test('BK-453: should render the select a user story prompt when no story query param is present', async ({ ui }) => {
    await ui.traceability.expectNoStorySelectedPrompt(FIXTURE_PROJECT_SLUG);
  });
});

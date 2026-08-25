/**
 * KATA Architecture - BK-45 Traceability Draft-Status Lifecycle Guard
 *
 * BK-452 (TC20): a draft-status Story must be fully accessible on the
 * traceability view, exactly like any other lifecycle status, with no
 * additional gate, redirect, or restricted-content banner imposed.
 *
 * Reuses the same seeded fixture story as BK-445/BK-456 - confirmed live
 * (2026-08-25, `GET /v1/user-stories/{id}`) to already carry
 * `status: "draft"`. Per this TC's own ROI note, any draft-status story
 * satisfies the precondition; no dedicated fixture was seeded.
 */

import { test } from '@TestFixture';

const FIXTURE_PROJECT_SLUG = 'bk-45-traceability-fixtures';
const FIXTURE_STORY_ID = 'cb997c18-3b51-45e3-8a16-84d7aa3bd222';

test.describe('BK-45: Traceability draft-status lifecycle guard', () => {
  test('BK-452: should render the chain for a draft-status Story with no additional lifecycle gate', async ({ ui }) => {
    await ui.traceability.expectDraftStoryHasNoLifecycleGate({
      projectSlug: FIXTURE_PROJECT_SLUG,
      userStoryId: FIXTURE_STORY_ID,
    });
  });
});

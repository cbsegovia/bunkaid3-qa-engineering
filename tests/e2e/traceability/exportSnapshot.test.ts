/**
 * KATA Architecture - BK-50 Traceability Export Snapshot Tests
 *
 * TC01 (BK-331), TC02 (BK-332) and TC03 (BK-333) — the story's happy path,
 * the self-containment guarantee, and the immutability guarantee. See
 * BK-50 spec.md §1 for why none of them re-asserts rendered markup: the 13
 * unit tests in `lib/traceability/export-snapshot.test.ts` already do that.
 *
 * KNOWN GAP — none of these can run live yet: the staging QA account
 * (`bunkai-staging-qa3@olkacoraug.resend.app`, minted by /adapt-framework)
 * authenticates but has no workspace membership (`workspaces: []`), so it
 * cannot view any real chain to export. See
 * .context/reports/adapt-framework-plan.md "Known gaps" #1. Written and
 * type/lint-clean; run once the QA account has an invite.
 *
 * Project: e2e (depends on ui-setup)
 */

import { join } from 'node:path';
import { expect, test } from '@TestFixture';

// TODO(BK-50): once the QA account is invited to a workspace, resolve
// these from the BK-45 fixture set on staging ("bk-45-fixtures" module,
// "full 5-layer evidence chain" story) instead of a placeholder — see
// BK-50 spec.md §6 (Discover strategy: never hardcode the UUID).
const FIXTURE_PROJECT_SLUG = 'bk-45-fixtures';
const FIXTURE_STORY_ID = 'full-5-layer-evidence-chain';

test.describe('BK-50: Traceability export snapshot', { tag: ['@critical'] }, () => {
  test('BK-50: should download a self-contained document carrying the full chain, its identity and the export timestamp', async ({ ui }) => {
    const savePath = join('tests/data/downloads', `${ui.data.createTestId('bk331')}.html`);

    await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: FIXTURE_STORY_ID });
    const downloadedPath = await ui.traceability.exportSnapshot(savePath);

    expect(downloadedPath).toBe(savePath);
  });

  test('BK-50: should render the downloaded snapshot completely with zero external requests when opened offline', async ({ ui }) => {
    const savePath = join('tests/data/downloads', `${ui.data.createTestId('bk332')}.html`);

    await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: FIXTURE_STORY_ID });
    await ui.traceability.exportSnapshot(savePath);

    // Chained after the TC01 download rather than re-exporting — BK-50
    // spec.md §5, "Dependencies: needs a downloaded artifact from TC01".
    await ui.snapshot.openOffline(savePath);
  });

  test('BK-50: should preserve the chain exactly as captured when the live chain changes after export', async ({ test: fixture }) => {
    const { ui, api } = fixture;
    const t0Path = join('tests/data/downloads', `${ui.data.createTestId('bk333-t0')}.html`);
    const t1Path = join('tests/data/downloads', `${ui.data.createTestId('bk333-t1')}.html`);
    const mutatedTitle = `${ui.data.createTestId('bk333-mutated')} — DO NOT SAVE`;

    await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: FIXTURE_STORY_ID });
    const originalTitle = await ui.traceability.page.locator('h1').first().textContent() ?? '';

    await api.userStory.mutateStoryTitleAndRestore({
      storyId: FIXTURE_STORY_ID,
      mutatedTitle,
      run: async () => {
        await ui.traceability.exportSnapshot(t0Path);

        await ui.traceability.goto({ projectSlug: FIXTURE_PROJECT_SLUG, userStoryId: FIXTURE_STORY_ID });
        await ui.traceability.exportSnapshot(t1Path);
      },
    });

    // Flow-level comparison — T0 vs T1 — stays here, not inside either ATC.
    await ui.snapshot.expectSnapshotUnchangedAfterMutation({
      snapshotPath: t0Path,
      expectedTitle: originalTitle.trim(),
    });
    const t1Title = await ui.snapshot.readStoryTitle(t1Path);
    expect(t1Title).toBe(mutatedTitle);
  });
});

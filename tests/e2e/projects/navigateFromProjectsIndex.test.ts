/**
 * KATA Architecture - BK-266 Projects Index Navigation Test
 *
 * TC03 (BK-606) — every index entry leads to that exact project.
 *
 * Project: e2e (depends on ui-setup)
 */

import { expect, test } from '@TestFixture';

test.describe('BK-266: Projects index navigation', { tag: ['@critical'] }, () => {
  test('BK-266: should navigate to the exact project activated from the index', async ({ test: fixture }) => {
    const { ui, api } = fixture;

    const [, me] = await api.auth.getCurrentUser();
    const workspaceId = me.active_workspace_id;
    expect(workspaceId).toBeTruthy();

    const project = ui.data.createProject();
    const [, body] = await api.projects.createProjectSuccessfully(workspaceId!, project);

    await ui.projects.open();
    await ui.projects.activateProjectEntryNavigatesToProject(body.project.slug);
  });
});

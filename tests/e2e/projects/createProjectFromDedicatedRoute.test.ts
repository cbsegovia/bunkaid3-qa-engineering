/**
 * KATA Architecture - BK-266 Dedicated Create Route Tests
 *
 * TC05 (BK-609, happy path), TC06 (BK-610, BVA invalid — 2 chars), TC07
 * (BK-611, BVA valid boundary — 3 chars) and TC08 (BK-612, duplicate name).
 * BK-610/BK-611 are the boundary pair the ATP calls out explicitly.
 *
 * Project: e2e (depends on ui-setup)
 */

import { expect, test } from '@TestFixture';

test.describe('BK-266: Create project from dedicated route', { tag: ['@critical'] }, () => {
  test('BK-266: should land on the new project when creating from the dedicated route', async ({ ui }) => {
    const project = ui.data.createProject();

    const slug = await ui.projects.createProjectFromDedicatedRouteLandsOnProject(project.name);
    expect(slug).toBeTruthy();
  });

  test('BK-266: should reject a two-character name and preserve what was typed', async ({ ui }) => {
    await ui.projects.rejectsShortNameAndPreservesInput('ab');
  });

  test('BK-266: should accept a name at the three-character boundary', async ({ ui }) => {
    await ui.projects.acceptsThreeCharacterBoundaryName('abc');
  });

  test('BK-266: should refuse a duplicate project name the same way it works today', async ({ test: fixture }) => {
    const { ui, api } = fixture;

    const [, me] = await api.auth.getCurrentUser();
    const workspaceId = me.active_workspace_id;
    expect(workspaceId).toBeTruthy();

    const project = ui.data.createProject();
    await api.projects.createProjectSuccessfully(workspaceId!, project);

    await ui.projects.refusesDuplicateProjectName(project.name);
  });
});

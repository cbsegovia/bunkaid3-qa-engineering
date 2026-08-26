/**
 * KATA Architecture - Layer 3: Projects API Component
 *
 * API component for BK-266's Projects module — currently a single SETUP
 * helper, not an ATC surface. `createProjectSuccessfully` seeds precondition
 * projects for the UI-driven list ATCs (BK-604/605/607) via the real
 * endpoint the product's own create-project form calls
 * (`POST /api/v1/workspaces/{id}/projects` — confirmed against
 * app/(app)/projects/create-project-form.tsx on origin/staging).
 *
 * No `@atc` here: the write has no dedicated Jira Test of its own — BK-609
 * (create-from-dedicated-route) is a UI ATC on ProjectsPage, since the AC it
 * covers is specifically about the UI flow, not API-level creation.
 */

import type { APIResponse } from '@playwright/test';
import type { CreateProjectPayload, CreateProjectResponse } from '@schemas/project.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { step } from '@utils/decorators';

// Re-export types for consumers that import from ProjectsApi
export type { CreateProjectPayload, CreateProjectResponse } from '@schemas/project.types';

// ============================================
// Projects API Component
// ============================================

export class ProjectsApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // Helpers - Setup only (no @atc)
  // ============================================

  /**
   * Helper: seed a Project in the given workspace.
   *
   * Setup-only write — used to precondition the Projects-index list ATCs.
   * Fails fast (asserts 201) so a broken seed surfaces at the precondition,
   * not as a confusing downstream assertion failure in the ATC it feeds.
   */
  @step
  async createProjectSuccessfully(
    workspaceId: string,
    payload: CreateProjectPayload,
  ): Promise<[APIResponse, CreateProjectResponse]> {
    const [response, body] = await this.apiPOST<CreateProjectResponse, CreateProjectPayload>(
      `/v1/workspaces/${workspaceId}/projects`,
      payload,
    );
    expect(response.status()).toBe(201);
    return [response, body];
  }
}

/**
 * KATA Architecture - Layer 3: Traceability API Component
 *
 * API component for BK-45's evidence chain read
 * (GET /api/v1/projects/{id}/traceability?story={userStoryId}).
 *
 * `{id}` (the Project) is a CONSISTENCY ASSERTION on the URL, never a scope
 * parameter — the RPC derives the real Project from the Story's own
 * `module_id`. A mismatched {id}/story pair 404s byte-identical to an
 * unknown story (BK-329 ruling, comment 12171/12176). This component's
 * two negative ATCs below exist specifically to regression-guard that.
 *
 * ATCs follow flow-based design: each ATC is an ACTION + VERIFICATION.
 *
 * NOTE: `@atc('BK-107'..'BK-109')` below are PLACEHOLDER IDs — no real Jira
 * Test issue exists yet for these flows. The 20 real Test issues already
 * documented for BK-45 (BK-445..BK-464, via /test-documentation) are the
 * ones that should eventually replace these placeholders — see BK-460
 * (TC08, cross-story defect leak) and BK-448 (TC16, non-disclosure parity)
 * in particular, which map directly to the two negative ATCs here.
 */

import type { APIResponse } from '@playwright/test';
import type { ErrorEnvelope } from '@schemas/auth.types';
import type { GetTraceabilityResponse } from '@schemas/traceability.types';
import type { TestContextOptions } from '@TestContext';

import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc } from '@utils/decorators';

// Re-export types for consumers that import from TraceabilityApi
export type { ErrorEnvelope } from '@schemas/auth.types';
export type { GetTraceabilityResponse } from '@schemas/traceability.types';

// ============================================
// Traceability API Component
// ============================================

export class TraceabilityApi extends ApiBase {
  constructor(options: TestContextOptions) {
    super(options);
  }

  // ============================================
  // ATCs - Complete Test Cases (ACTION + VERIFICATION)
  // ============================================

  /**
   * ATC: Read a User Story's full evidence chain - expects success (200)
   *
   * @param args - the Project the Story belongs to, and the Story itself
   * @param args.projectId - Project the Story belongs to
   * @param args.userStoryId - Story to fetch the chain for
   */
  @atc('BK-107')
  async getStoryChainSuccessfully(
    args: { projectId: string, userStoryId: string },
  ): Promise<[APIResponse, GetTraceabilityResponse]> {
    const [response, body] = await this.apiGET<GetTraceabilityResponse>(
      `/v1/projects/${args.projectId}/traceability?story=${args.userStoryId}`,
    );

    expect(response.status()).toBe(200);
    expect(body.story).toBeDefined();

    return [response, body];
  }

  /**
   * ATC: Request the chain with an unauthenticated caller - expects 401
   *
   * @param args - the Project and Story to request (content is irrelevant — must never render)
   * @param args.projectId - Project to request the chain for
   * @param args.userStoryId - Story to request the chain for
   */
  @atc('BK-108')
  async expectUnauthenticatedRejection(
    args: { projectId: string, userStoryId: string },
  ): Promise<[APIResponse, ErrorEnvelope]> {
    const savedToken = this.authToken;
    this.clearAuthToken();

    const [response, body] = await this.apiGET<ErrorEnvelope>(
      `/v1/projects/${args.projectId}/traceability?story=${args.userStoryId}`,
    );

    expect(response.status()).toBe(401);
    expect(body.error.code).toBe('unauthorized');

    if (savedToken) {
      this.setAuthToken(savedToken);
    }

    return [response, body];
  }

  /**
   * ATC: Request the chain with a {projectId}/story pair that does not
   * belong together (wrong project, or a foreign/nonexistent story) -
   * expects the SAME uniform 404 as an unknown story, never a 403 and
   * never any chain data (BK-329 non-disclosure ruling).
   *
   * @param args - a mismatched Project/Story pair
   * @param args.projectId - Project that does not own the given Story
   * @param args.userStoryId - Story that does not belong to the given Project
   */
  @atc('BK-109')
  async expectMismatchedPairNotFound(
    args: { projectId: string, userStoryId: string },
  ): Promise<[APIResponse, ErrorEnvelope]> {
    const [response, body] = await this.apiGET<ErrorEnvelope>(
      `/v1/projects/${args.projectId}/traceability?story=${args.userStoryId}`,
    );

    expect(response.status()).toBe(404);
    expect(body.error.code).toBe('not_found');

    return [response, body];
  }
}

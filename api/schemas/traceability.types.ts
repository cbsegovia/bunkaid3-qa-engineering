/**
 * KATA Framework - Type Facade: Traceability Domain
 *
 * Covers BK-45 (render the chain) and BK-50 (export the chain as a snapshot).
 * `{projectId}` in the route is a consistency assertion checked against the
 * Story's real Project (via module_id) — never a scope parameter (BK-329/BK-45
 * ruling). A mismatched pair 404s, byte-identical to an unknown story.
 *
 * Consumed by: tests/components/api/TraceabilityApi.ts
 */

import type { components, paths } from '@openapi';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

export type StoryTraceabilityPayload = components['schemas']['StoryTraceabilityPayload'];
// ErrorEnvelope is shared across every domain — canonical export lives in ./auth.types

// ============================================================================
// Endpoint Types — GET /api/v1/projects/{id}/traceability?story={userStoryId}
// ============================================================================

type GetTraceabilityPath = paths['/api/v1/projects/{id}/traceability']['get'];
export type GetTraceabilityResponse = GetTraceabilityPath['responses']['200']['content']['application/json'];

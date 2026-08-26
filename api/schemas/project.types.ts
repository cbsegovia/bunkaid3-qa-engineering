/**
 * KATA Framework - Type Facade: Project Domain
 *
 * Types mirror the real OpenAPI contract synced from
 * https://staging-upexbunkai.vercel.app/api/openapi.
 *
 * Consumed by: tests/components/api/ProjectsApi.ts
 */

import type { paths } from '@openapi';

// ============================================================================
// Endpoint Types — POST /api/v1/workspaces/{id}/projects
// ============================================================================

type CreateProjectPath = paths['/api/v1/workspaces/{id}/projects']['post'];
export type CreateProjectPayload = CreateProjectPath['requestBody']['content']['application/json'];
export type CreateProjectResponse = CreateProjectPath['responses'][201]['content']['application/json'];

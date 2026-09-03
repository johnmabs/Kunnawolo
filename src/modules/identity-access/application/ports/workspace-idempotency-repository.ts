import type { WorkspacePreference } from "../../domain/workspace-preference";

export interface WorkspaceIdempotencyRepository {
  saveIdempotently(
    preference: WorkspacePreference,
    key: string,
    fingerprint: string,
  ): Promise<WorkspacePreference>;
}

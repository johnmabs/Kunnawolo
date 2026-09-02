import type { WorkspacePreference } from "../../domain/workspace-preference";

export interface WorkspacePreferenceRepository {
  find(organizationId: string, actorId: string): Promise<WorkspacePreference | null>;
  save(preference: WorkspacePreference): Promise<void>;
}

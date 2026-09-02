import type { WorkspacePreference } from "../domain/workspace-preference";
import type { WorkspacePreferenceAuthorization } from "./ports/workspace-preference-authorization";
import type { WorkspacePreferenceRepository } from "./ports/workspace-preference-repository";

export class GetWorkspacePreference {
  public constructor(private readonly preferences: WorkspacePreferenceRepository, private readonly authorization: WorkspacePreferenceAuthorization) {}

  public async execute(input: Readonly<{ organizationId: string; actorId: string }>): Promise<WorkspacePreference | null> {
    const preference = await this.preferences.find(input.organizationId, input.actorId);
    await this.authorization.authorize(input.organizationId, input.actorId, preference?.shopId?.value ?? null);
    return preference;
  }
}

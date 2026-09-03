import { WorkspacePreference } from "../domain/workspace-preference";
import type { WorkspacePreferenceAuthorization } from "./ports/workspace-preference-authorization";
import type { WorkspacePreferenceRepository } from "./ports/workspace-preference-repository";

export class SaveWorkspacePreference {
  public constructor(
    private readonly preferences: WorkspacePreferenceRepository,
    private readonly authorization: WorkspacePreferenceAuthorization,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      actorId: string;
      shopId?: string | null;
      isCompact?: boolean;
    }>,
  ): Promise<WorkspacePreference> {
    const current = await this.preferences.find(
      input.organizationId,
      input.actorId,
    );
    const preference = WorkspacePreference.configure({
      id:
        current?.id.value ??
        `workspace:${input.organizationId}:${input.actorId}`,
      organizationId: input.organizationId,
      actorId: input.actorId,
      shopId: input.shopId,
      isCompact: input.isCompact,
    });
    await this.authorization.authorize(
      input.organizationId,
      input.actorId,
      preference.shopId?.value ?? null,
    );
    await this.preferences.save(preference);
    return preference;
  }
}

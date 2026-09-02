import { DomainError } from "@/shared/domain/domain-error";
import { WorkspacePreference } from "../domain/workspace-preference";
import { WorkspaceIdempotencyKey } from "../domain/workspace-idempotency-key";
import type { WorkspacePreferenceAuthorization } from "./ports/workspace-preference-authorization";
import type { WorkspacePreferenceRepository } from "./ports/workspace-preference-repository";
import type { WorkspaceIdempotencyRepository } from "./ports/workspace-idempotency-repository";

export class SaveWorkspacePreferenceIdempotently {
  public constructor(private readonly preferences: WorkspacePreferenceRepository, private readonly idempotency: WorkspaceIdempotencyRepository, private readonly authorization: WorkspacePreferenceAuthorization) {}

  public async execute(input: Readonly<{ organizationId: string; actorId: string; shopId?: string | null; isCompact?: boolean; idempotencyKey: string }>): Promise<WorkspacePreference> {
    const current = await this.preferences.find(input.organizationId, input.actorId);
    const preference = WorkspacePreference.configure({ id: current?.id.value ?? `workspace:${input.organizationId}:${input.actorId}`, organizationId: input.organizationId, actorId: input.actorId, shopId: input.shopId, isCompact: input.isCompact });
    await this.authorization.authorize(input.organizationId, input.actorId, preference.shopId?.value ?? null);
    const key = WorkspaceIdempotencyKey.fromString(input.idempotencyKey);
    const fingerprint = JSON.stringify({ shopId: preference.shopId?.value ?? null, isCompact: preference.isCompact });
    const result = await this.idempotency.saveIdempotently(preference, key.value, fingerprint);
    if (result.organizationId.value !== input.organizationId || result.actorId.value !== input.actorId) throw new DomainError("workspace.idempotency_conflict", "The idempotent result does not belong to this workspace.");
    return result;
  }
}

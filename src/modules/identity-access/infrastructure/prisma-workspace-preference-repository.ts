import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { WorkspacePreference } from "../domain/workspace-preference";
import type { WorkspacePreferenceRepository } from "../application/ports/workspace-preference-repository";

const toPreference = (row: Readonly<{ id: string; organizationId: string; actorId: string; shopId: string | null; isCompact: boolean }>): WorkspacePreference => WorkspacePreference.configure({ id: row.id, organizationId: row.organizationId, actorId: row.actorId, shopId: row.shopId, isCompact: row.isCompact });

export class PrismaWorkspacePreferenceRepository implements WorkspacePreferenceRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async find(organizationId: string, actorId: string): Promise<WorkspacePreference | null> {
    const row = await this.prisma.workspacePreference.findUnique({ where: { organizationId_actorId: { organizationId, actorId } } });
    return row === null ? null : toPreference(row);
  }

  public async save(preference: WorkspacePreference): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.workspacePreference.findUnique({ where: { organizationId_actorId: { organizationId: preference.organizationId.value, actorId: preference.actorId.value } } });
      if (existing !== null && existing.shopId === (preference.shopId?.value ?? null) && existing.isCompact === preference.isCompact) return;
      await tx.workspacePreference.upsert({ where: { organizationId_actorId: { organizationId: preference.organizationId.value, actorId: preference.actorId.value } }, create: { id: preference.id.value, organizationId: preference.organizationId.value, actorId: preference.actorId.value, shopId: preference.shopId?.value ?? null, isCompact: preference.isCompact }, update: { shopId: preference.shopId?.value ?? null, isCompact: preference.isCompact } });
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: preference.organizationId.value, actorId: preference.actorId.value, shopId: preference.shopId?.value ?? null, action: "workspace.preference_saved", reference: preference.id.value } });
    });
  }
}

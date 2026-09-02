import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { WorkspacePreference } from "../domain/workspace-preference";
import type { WorkspacePreferenceRepository } from "../application/ports/workspace-preference-repository";
import type { WorkspaceIdempotencyRepository } from "../application/ports/workspace-idempotency-repository";
import { DomainError } from "@/shared/domain/domain-error";

const toPreference = (row: Readonly<{ id: string; organizationId: string; actorId: string; shopId: string | null; isCompact: boolean }>): WorkspacePreference => WorkspacePreference.configure({ id: row.id, organizationId: row.organizationId, actorId: row.actorId, shopId: row.shopId, isCompact: row.isCompact });

export class PrismaWorkspacePreferenceRepository implements WorkspacePreferenceRepository, WorkspaceIdempotencyRepository {
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

  public async saveIdempotently(preference: WorkspacePreference, key: string, fingerprint: string): Promise<WorkspacePreference> {
    return this.prisma.$transaction(async (tx) => {
      const replay = await tx.workspaceIdempotencyRecord.findUnique({ where: { organizationId_actorId_key: { organizationId: preference.organizationId.value, actorId: preference.actorId.value, key } } });
      if (replay !== null) {
        if (replay.fingerprint !== fingerprint) throw new DomainError("workspace.idempotency_conflict", "The idempotency key was already used for another preference.");
        return WorkspacePreference.configure({ id: preference.id.value, organizationId: replay.organizationId, actorId: replay.actorId, shopId: replay.shopId, isCompact: replay.isCompact });
      }
      const existing = await tx.workspacePreference.findUnique({ where: { organizationId_actorId: { organizationId: preference.organizationId.value, actorId: preference.actorId.value } } });
      const changed = existing === null || existing.shopId !== (preference.shopId?.value ?? null) || existing.isCompact !== preference.isCompact;
      await tx.workspacePreference.upsert({ where: { organizationId_actorId: { organizationId: preference.organizationId.value, actorId: preference.actorId.value } }, create: { id: preference.id.value, organizationId: preference.organizationId.value, actorId: preference.actorId.value, shopId: preference.shopId?.value ?? null, isCompact: preference.isCompact }, update: { shopId: preference.shopId?.value ?? null, isCompact: preference.isCompact } });
      await tx.workspaceIdempotencyRecord.create({ data: { id: crypto.randomUUID(), organizationId: preference.organizationId.value, actorId: preference.actorId.value, key, fingerprint, shopId: preference.shopId?.value ?? null, isCompact: preference.isCompact } });
      if (changed) await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: preference.organizationId.value, actorId: preference.actorId.value, shopId: preference.shopId?.value ?? null, action: "workspace.preference_saved", reference: preference.id.value } });
      return preference;
    });
  }
}

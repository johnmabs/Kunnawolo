import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { ApiAccessKey } from "../domain/api-access-key";
import type { ApiAccessKeyRepository, ApiKeyAudit } from "../application/ports/api-access-key-repository";

const toKey = (row: Readonly<{ id: string; organizationId: string; actorId: string; label: string; secretSalt: string; secretHash: string; expiresAt: Date | null; revokedAt: Date | null; createdAt: Date }>): ApiAccessKey => ApiAccessKey.restore({ id: Identifier.fromString(row.id), organizationId: Identifier.fromString(row.organizationId), actorId: Identifier.fromString(row.actorId), label: row.label, secretSalt: row.secretSalt, secretHash: row.secretHash, expiresAt: row.expiresAt, revokedAt: row.revokedAt, createdAt: row.createdAt });

export class PrismaApiAccessKeyRepository implements ApiAccessKeyRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: string): Promise<ApiAccessKey | null> {
    const row = await this.prisma.apiAccessKey.findUnique({ where: { id } });
    return row === null ? null : toKey(row);
  }

  public async findByOrganizationAndId(organizationId: string, id: string): Promise<ApiAccessKey | null> {
    const row = await this.prisma.apiAccessKey.findFirst({ where: { id, organizationId } });
    return row === null ? null : toKey(row);
  }

  public async save(key: ApiAccessKey, audit: ApiKeyAudit): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.apiAccessKey.findFirst({ where: { organizationId: key.organizationId.value, label: key.label, NOT: { id: key.id.value } } });
      if (duplicate !== null) throw new DomainError("security.api_key_label_taken", "An API key label must be unique in its organization.");
      await tx.apiAccessKey.upsert({ where: { id: key.id.value }, create: { id: key.id.value, organizationId: key.organizationId.value, actorId: key.actorId.value, label: key.label, secretSalt: key.secretSalt, secretHash: key.secretHash, expiresAt: key.expiresAt, revokedAt: key.revokedAt, createdAt: key.createdAt }, update: { revokedAt: key.revokedAt } });
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: audit.organizationId, actorId: audit.actorId, action: audit.action } });
    });
  }
}

import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { ApiKeyAccessAuthorization } from "../application/ports/api-key-access-authorization";

export class PrismaApiKeyAccessAuthorization implements ApiKeyAccessAuthorization {
  public constructor(private readonly prisma: PrismaClient) {}

  public async authorizeActiveMembership(organizationId: string, actorId: string): Promise<void> {
    if (await this.prisma.organizationMembership.count({ where: { organizationId, userAccountId: actorId, status: "ACTIVE" } }) !== 1) throw new DomainError("security.api_key_forbidden", "The API key actor is not active in this organization.");
  }

  public async authorizeOwner(organizationId: string, actorId: string): Promise<void> {
    if (await this.prisma.organizationMembership.count({ where: { organizationId, userAccountId: actorId, status: "ACTIVE", role: "OWNER" } }) !== 1) throw new DomainError("security.api_key_forbidden", "Only an active organization owner can manage API keys.");
  }
}

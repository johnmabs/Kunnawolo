import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { WorkspacePreferenceAuthorization } from "../application/ports/workspace-preference-authorization";

export class PrismaWorkspacePreferenceAuthorization implements WorkspacePreferenceAuthorization {
  public constructor(private readonly prisma: PrismaClient) {}

  public async authorize(organizationId: string, actorId: string, shopId: string | null): Promise<void> {
    const membership = await this.prisma.organizationMembership.findFirst({ where: { organizationId, userAccountId: actorId, status: "ACTIVE" }, include: { shopAssignments: true } });
    if (membership === null) throw new DomainError("workspace.preference_forbidden", "The actor is not active in this organization.");
    if (shopId !== null && await this.prisma.shop.count({ where: { id: shopId, organizationId } }) !== 1) throw new DomainError("workspace.shop_not_found", "The shop does not belong to this organization.");
    if (membership.role !== "OWNER" && (shopId === null || !membership.shopAssignments.some((assignment) => assignment.shopId === shopId))) throw new DomainError("workspace.preference_forbidden", "The actor is not assigned to this shop.");
  }
}

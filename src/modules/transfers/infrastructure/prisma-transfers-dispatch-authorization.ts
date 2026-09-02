import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { TransfersDispatchAuthorization } from "../application/ports/transfers-dispatch-authorization";

export class PrismaTransfersDispatchAuthorization implements TransfersDispatchAuthorization {
  public constructor(private readonly prisma: PrismaClient) {}

  public async authorize(organizationId: string, sourceShopId: string, actorId: string | null): Promise<void> {
    if (actorId === null) throw new DomainError("transfers.dispatch_forbidden", "An actor is required to send a transfer.");
    const membership = await this.prisma.organizationMembership.findFirst({ where: { organizationId, userAccountId: actorId, status: "ACTIVE" }, include: { shopAssignments: true } });
    if (membership === null || (membership.role !== "OWNER" && (membership.role !== "MANAGER" || !membership.shopAssignments.some(({ shopId }) => shopId === sourceShopId)))) {
      throw new DomainError("transfers.dispatch_forbidden", "Only an authorized owner or manager can send this transfer.");
    }
  }
}

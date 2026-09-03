import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { TransfersReceptionAuthorization } from "../application/ports/transfers-reception-authorization";

export class PrismaTransfersReceptionAuthorization implements TransfersReceptionAuthorization {
  public constructor(private readonly prisma: PrismaClient) {}
  public async authorize(
    organizationId: string,
    destinationShopId: string,
    actorId: string | null,
  ): Promise<void> {
    if (actorId === null)
      throw new DomainError(
        "transfers.reception_forbidden",
        "An actor is required to receive a transfer.",
      );
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { organizationId, userAccountId: actorId, status: "ACTIVE" },
      include: { shopAssignments: true },
    });
    if (
      membership === null ||
      (membership.role !== "OWNER" &&
        (membership.role !== "MANAGER" ||
          !membership.shopAssignments.some(
            ({ shopId }) => shopId === destinationShopId,
          )))
    )
      throw new DomainError(
        "transfers.reception_forbidden",
        "Only an authorized owner or manager can receive this transfer.",
      );
  }
}

import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { OperationalAlertReadAuthorization } from "../application/ports/operational-alert-read-authorization";

export class PrismaOperationalAlertReadAuthorization implements OperationalAlertReadAuthorization {
  public constructor(private readonly prisma: PrismaClient) {}
  public async authorize(
    organizationId: string,
    actorId: string,
    shopId: string | null,
  ): Promise<void> {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { organizationId, userAccountId: actorId, status: "ACTIVE" },
      include: { shopAssignments: true },
    });
    if (membership === null || membership.role === "CASHIER")
      throw new DomainError(
        "observability.alerts_forbidden",
        "Only an authorized owner or manager can read alerts.",
      );
    if (
      shopId !== null &&
      (await this.prisma.shop.count({
        where: { id: shopId, organizationId },
      })) !== 1
    )
      throw new DomainError(
        "observability.shop_not_found",
        "The shop does not belong to this organization.",
      );
    if (
      membership.role === "MANAGER" &&
      (shopId === null ||
        !membership.shopAssignments.some(
          (assignment) => assignment.shopId === shopId,
        ))
    )
      throw new DomainError(
        "observability.alerts_forbidden",
        "The manager is not assigned to this shop.",
      );
  }
}

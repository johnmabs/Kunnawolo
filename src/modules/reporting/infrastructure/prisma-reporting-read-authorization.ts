import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { ReportingReadAuthorization } from "../application/ports/reporting-read-authorization";

export class PrismaReportingReadAuthorization implements ReportingReadAuthorization {
  public constructor(private readonly prisma: PrismaClient) {}

  public async authorize(organizationId: string, shopId: string | null, actorId: string | null): Promise<void> {
    if (actorId === null) throw new DomainError("reporting.read_forbidden", "An actor is required to view reporting.");
    const membership = await this.prisma.organizationMembership.findFirst({ where: { organizationId, userAccountId: actorId, status: "ACTIVE" }, include: { shopAssignments: true } });
    if (membership === null || membership.role === "CASHIER") throw new DomainError("reporting.read_forbidden", "Only an authorized owner or manager can view reporting.");
    if (shopId !== null && await this.prisma.shop.count({ where: { id: shopId, organizationId } }) !== 1) throw new DomainError("reporting.shop_not_found", "The shop does not belong to this organization.");
    if (membership.role === "MANAGER" && (shopId === null || !membership.shopAssignments.some((assignment) => assignment.shopId === shopId))) {
      throw new DomainError("reporting.read_forbidden", "The manager is not assigned to this shop.");
    }
  }
}

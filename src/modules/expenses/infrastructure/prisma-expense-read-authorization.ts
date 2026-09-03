import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type {
  ExpenseReadAuthorization,
  ExpenseReadScope,
} from "../application/ports/expense-read-authorization";

export class PrismaExpenseReadAuthorization implements ExpenseReadAuthorization {
  public constructor(private readonly prisma: PrismaClient) {}

  public async authorize(
    organizationId: string,
    requestedShopId: string | null,
    actorId: string | null,
  ): Promise<ExpenseReadScope> {
    if (actorId === null)
      throw new DomainError(
        "expenses.read_forbidden",
        "An actor is required to consult expenses.",
      );
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { organizationId, userAccountId: actorId, status: "ACTIVE" },
      include: { shopAssignments: true },
    });
    if (membership === null || membership.role === "CASHIER")
      throw new DomainError(
        "expenses.read_forbidden",
        "Only an authorized owner or manager can consult expenses.",
      );
    if (membership.role === "OWNER") return { shopIds: null };
    const assignedShopIds = membership.shopAssignments.map(
      ({ shopId }) => shopId,
    );
    if (requestedShopId !== null && !assignedShopIds.includes(requestedShopId))
      throw new DomainError(
        "expenses.read_forbidden",
        "The manager is not assigned to this shop.",
      );
    return {
      shopIds: requestedShopId === null ? assignedShopIds : [requestedShopId],
    };
  }
}

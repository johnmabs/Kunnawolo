import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { ValuedLossReportingSource } from "../application/ports/valued-loss-reporting-source";
export class PrismaValuedLossReportingSource implements ValuedLossReportingSource {
  public constructor(private readonly prisma: PrismaClient) {}
  public async valuedLossAmount(
    input: Readonly<{
      organizationId: string;
      shopId: string | null;
      occurredFrom: Date | null;
      occurredTo: Date | null;
    }>,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { currency: true },
    });
    if (org === null)
      throw new DomainError(
        "reporting.organization_not_found",
        "The organization does not exist.",
      );
    const rows = await this.prisma.stockLoss.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.shopId === null ? {} : { shopId: input.shopId }),
        ...(input.occurredFrom === null && input.occurredTo === null
          ? {}
          : {
              occurredAt: {
                ...(input.occurredFrom === null
                  ? {}
                  : { gte: input.occurredFrom }),
                ...(input.occurredTo === null ? {} : { lte: input.occurredTo }),
              },
            }),
      },
      select: { quantity: true, referenceCostMinor: true, currency: true },
    });
    let amountMinor = 0;
    for (const row of rows) {
      const amount = Number(row.quantity) * Number(row.referenceCostMinor);
      if (row.currency !== org.currency || !Number.isSafeInteger(amount))
        throw new DomainError(
          "reporting.invalid_loss_snapshot",
          "A stock loss snapshot is invalid for reporting.",
        );
      amountMinor += amount;
      if (!Number.isSafeInteger(amountMinor))
        throw new DomainError(
          "reporting.estimated_result_overflow",
          "The estimated result exceeds safe money bounds.",
        );
    }
    return { currency: org.currency, amountMinor };
  }
}

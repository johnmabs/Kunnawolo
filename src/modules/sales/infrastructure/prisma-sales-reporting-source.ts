import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type {
  FinalizedSaleSnapshot,
  SalesReportingData,
  SalesReportingSource,
} from "../application/ports/sales-reporting-source";

type SaleRow = Readonly<{
  shopId: string;
  finalizedAt: Date | null;
  lines: readonly {
    quantity: { toString(): string };
    unitPriceMinor: bigint;
    unitCostMinor: bigint;
    discountMinor: bigint;
    currency: string;
  }[];
}>;

function toSnapshot(row: SaleRow, currency: string): FinalizedSaleSnapshot {
  if (row.finalizedAt === null || row.lines.length === 0)
    throw new DomainError(
      "reporting.invalid_sales_snapshot",
      "A finalized sale snapshot is incomplete.",
    );
  let revenueMinor = 0;
  let costMinor = 0;
  for (const line of row.lines) {
    const quantity = Number(line.quantity.toString());
    const revenue =
      Number(line.unitPriceMinor) * quantity - Number(line.discountMinor);
    const cost = Number(line.unitCostMinor) * quantity;
    if (
      line.currency !== currency ||
      !Number.isSafeInteger(revenue) ||
      !Number.isSafeInteger(cost) ||
      revenue < 0 ||
      cost < 0
    )
      throw new DomainError(
        "reporting.invalid_sales_snapshot",
        "A finalized sale line snapshot is invalid.",
      );
    revenueMinor += revenue;
    costMinor += cost;
    if (!Number.isSafeInteger(revenueMinor) || !Number.isSafeInteger(costMinor))
      throw new DomainError(
        "reporting.sales_projection_overflow",
        "The sales projection exceeds safe money bounds.",
      );
  }
  return {
    shopId: row.shopId,
    finalizedAt: row.finalizedAt,
    currency,
    revenueMinor,
    costMinor,
  };
}

export class PrismaSalesReportingSource implements SalesReportingSource {
  public constructor(private readonly prisma: PrismaClient) {}

  public async listFinalizedSales(
    input: Readonly<{
      organizationId: string;
      shopId: string | null;
      occurredFrom: Date | null;
      occurredTo: Date | null;
    }>,
  ): Promise<SalesReportingData> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { currency: true },
    });
    if (organization === null)
      throw new DomainError(
        "reporting.organization_not_found",
        "The organization does not exist.",
      );
    const rows = await this.prisma.saleCart.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.shopId === null ? {} : { shopId: input.shopId }),
        status: { in: ["FINALIZED", "PAID"] },
        ...(input.occurredFrom === null && input.occurredTo === null
          ? {}
          : {
              finalizedAt: {
                ...(input.occurredFrom === null
                  ? {}
                  : { gte: input.occurredFrom }),
                ...(input.occurredTo === null ? {} : { lte: input.occurredTo }),
              },
            }),
      },
      include: {
        lines: {
          select: {
            quantity: true,
            unitPriceMinor: true,
            unitCostMinor: true,
            discountMinor: true,
            currency: true,
          },
        },
      },
      orderBy: [{ finalizedAt: "asc" }, { id: "asc" }],
    });
    return {
      currency: organization.currency,
      sales: rows.map((row) => toSnapshot(row, organization.currency)),
    };
  }
}

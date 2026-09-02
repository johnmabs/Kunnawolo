import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { InventoryReportingData, InventoryReportingSource } from "../application/ports/inventory-reporting-source";

export class PrismaInventoryReportingSource implements InventoryReportingSource {
  public constructor(private readonly prisma: PrismaClient) {}

  public async projectStock(input: Readonly<{ organizationId: string; shopId: string | null; occurredFrom: Date | null; occurredTo: Date | null }>): Promise<InventoryReportingData> {
    const organization = await this.prisma.organization.findUnique({ where: { id: input.organizationId }, select: { id: true } });
    if (organization === null) throw new DomainError("reporting.organization_not_found", "The organization does not exist.");
    const shopScope = input.shopId === null ? {} : { shopId: input.shopId };
    const period = input.occurredFrom === null && input.occurredTo === null ? {} : { occurredAt: { ...(input.occurredFrom === null ? {} : { gte: input.occurredFrom }), ...(input.occurredTo === null ? {} : { lte: input.occurredTo }) } };
    const reconciliationPeriod = input.occurredFrom === null && input.occurredTo === null ? {} : { reconciledAt: { ...(input.occurredFrom === null ? {} : { gte: input.occurredFrom }), ...(input.occurredTo === null ? {} : { lte: input.occurredTo }) } };
    const [levels, losses, anomalyCount] = await Promise.all([
      this.prisma.stockLevel.aggregate({ where: { organizationId: input.organizationId, ...shopScope }, _sum: { quantity: true } }),
      this.prisma.stockLoss.aggregate({ where: { organizationId: input.organizationId, ...shopScope, ...period }, _sum: { quantity: true } }),
      this.prisma.inventoryReconciliationLine.count({ where: { quantityDifference: { not: 0 }, inventoryReconciliation: { organizationId: input.organizationId, ...shopScope, ...reconciliationPeriod } } }),
    ]);
    return { onHandQuantity: Number(levels._sum.quantity ?? 0), lossQuantity: Number(losses._sum.quantity ?? 0), anomalyCount };
  }
}

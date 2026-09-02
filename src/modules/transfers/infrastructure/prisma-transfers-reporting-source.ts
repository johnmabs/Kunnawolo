import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { TransfersReportingSource } from "../application/ports/transfers-reporting-source";

export class PrismaTransfersReportingSource implements TransfersReportingSource {
  public constructor(private readonly prisma: PrismaClient) {}

  public async inTransitQuantity(input: Readonly<{ organizationId: string; shopId: string | null }>): Promise<number> {
    const transfers = await this.prisma.stockTransfer.findMany({ where: { organizationId: input.organizationId, status: "SENT", ...(input.shopId === null ? {} : { OR: [{ sourceShopId: input.shopId }, { destinationShopId: input.shopId }] }) }, select: { lines: { select: { quantity: true } } } });
    return transfers.reduce((total, transfer) => total + transfer.lines.reduce((lineTotal, line) => lineTotal + Number(line.quantity), 0), 0);
  }
}

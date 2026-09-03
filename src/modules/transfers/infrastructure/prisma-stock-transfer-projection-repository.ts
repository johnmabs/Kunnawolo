import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { StockTransferProjectionRepository } from "../application/ports/stock-transfer-projection-repository";
import { StockTransferListProjection } from "../domain/stock-transfer-list-projection";

export class PrismaStockTransferProjectionRepository implements StockTransferProjectionRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async list(
    organizationId: string,
    shopId: string | null,
  ): Promise<StockTransferListProjection | null> {
    if (
      shopId !== null &&
      (await this.prisma.shop.count({
        where: { id: shopId, organizationId },
      })) !== 1
    )
      return null;
    const rows = await this.prisma.stockTransfer.findMany({
      where: {
        organizationId,
        ...(shopId === null
          ? {}
          : { OR: [{ sourceShopId: shopId }, { destinationShopId: shopId }] }),
      },
      include: {
        sourceShop: { select: { name: true } },
        destinationShop: { select: { name: true } },
        lines: {
          include: { product: { select: { name: true, code: true } } },
          orderBy: { id: "asc" },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return StockTransferListProjection.create(
      organizationId,
      rows.map((row) => ({
        transferId: row.id,
        sourceShopId: row.sourceShopId,
        sourceShopName: row.sourceShop.name,
        destinationShopId: row.destinationShopId,
        destinationShopName: row.destinationShop.name,
        status: row.status,
        lines: row.lines.map((line) => ({
          productId: line.productId,
          productName: line.product.name,
          productCode: line.product.code,
          quantity: Number(line.quantity),
        })),
        shipmentReference: row.shipmentReference,
        receptionReference: row.receptionReference,
        cancellationReference: row.cancellationReference,
        createdAt: row.createdAt,
        sentAt: row.sentAt,
        receivedAt: row.receivedAt,
        cancelledAt: row.cancelledAt,
      })),
    );
  }
}

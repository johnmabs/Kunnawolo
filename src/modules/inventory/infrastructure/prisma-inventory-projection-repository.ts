import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { InventoryProjectionRepository } from "../application/ports/inventory-projection-repository";
import { InventorySessionListProjection } from "../domain/inventory-session-list-projection";
import { StockListProjection } from "../domain/stock-list-projection";
import { StockLossHistoryProjection } from "../domain/stock-loss-history-projection";
import { StockMovementHistoryProjection } from "../domain/stock-movement-history-projection";

export class PrismaInventoryProjectionRepository implements InventoryProjectionRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async listStock(organizationId: string, shopId: string, productSearch: string | null): Promise<StockListProjection | null> {
    const shop = await this.prisma.shop.findFirst({ where: { id: shopId, organizationId }, select: { name: true } });
    if (shop === null) return null;
    const rows = await this.prisma.stockLevel.findMany({
      where: {
        organizationId,
        shopId,
        ...(productSearch === null ? {} : { product: { OR: [{ name: { contains: productSearch, mode: "insensitive" } }, { code: { contains: productSearch, mode: "insensitive" } }, { barcode: { contains: productSearch, mode: "insensitive" } }] } }),
      },
      include: { product: { select: { id: true, name: true, code: true, barcode: true } } },
      orderBy: [{ product: { name: "asc" } }, { productId: "asc" }],
    });
    return StockListProjection.create({ organizationId, shopId, shopName: shop.name, items: rows.map((row) => ({ stockLevelId: row.id, productId: row.product.id, productName: row.product.name, productCode: row.product.code, barcode: row.product.barcode, quantity: Number(row.quantity), lowStockThreshold: Number(row.lowStockThreshold) })) });
  }

  public async listSessions(organizationId: string, shopId: string): Promise<InventorySessionListProjection | null> {
    const shop = await this.prisma.shop.findFirst({ where: { id: shopId, organizationId }, select: { name: true } });
    if (shop === null) return null;
    const rows = await this.prisma.inventorySession.findMany({ where: { organizationId, shopId }, include: { lines: true }, orderBy: [{ openedAt: "desc" }, { id: "desc" }] });
    return InventorySessionListProjection.create({
      organizationId,
      shopId,
      shopName: shop.name,
      items: rows.map((row) => {
        const counted = row.lines.filter((line) => line.countedQuantity !== null);
        const discrepancies = counted.map((line) => Number(line.countedQuantity) - Number(line.expectedQuantity)).filter((difference) => difference !== 0);
        return { sessionId: row.id, status: row.status, openedAt: row.openedAt, closedAt: row.closedAt, totalLineCount: row.lines.length, countedLineCount: counted.length, discrepancyLineCount: discrepancies.length, discrepancyQuantity: discrepancies.reduce((total, difference) => total + Math.abs(difference), 0) };
      }),
    });
  }

  public async listMovements(organizationId: string, shopId: string, productId: string): Promise<StockMovementHistoryProjection | null> {
    const [shop, product] = await Promise.all([
      this.prisma.shop.findFirst({ where: { id: shopId, organizationId }, select: { id: true } }),
      this.prisma.product.findFirst({ where: { id: productId, organizationId }, select: { name: true } }),
    ]);
    if (shop === null || product === null) return null;
    const rows = await this.prisma.stockMovement.findMany({ where: { organizationId, shopId, productId }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }] });
    return StockMovementHistoryProjection.create({ organizationId, shopId, productId, productName: product.name, items: rows.map((row) => ({ movementId: row.id, quantityDelta: Number(row.quantityDelta), reason: row.reason, actorId: row.actorId, occurredAt: row.occurredAt })) });
  }

  public async listLosses(organizationId: string, shopId: string, productId: string | null): Promise<StockLossHistoryProjection | null> {
    const [shop, productCount] = await Promise.all([
      this.prisma.shop.count({ where: { id: shopId, organizationId } }),
      productId === null ? Promise.resolve(1) : this.prisma.product.count({ where: { id: productId, organizationId } }),
    ]);
    if (shop !== 1 || productCount !== 1) return null;
    const rows = await this.prisma.stockLoss.findMany({ where: { organizationId, shopId, ...(productId === null ? {} : { productId }) }, include: { product: { select: { name: true, code: true } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }] });
    return StockLossHistoryProjection.create({ organizationId, shopId, productId, items: rows.map((row) => ({ lossId: row.id, productId: row.productId, productName: row.product.name, productCode: row.product.code, quantity: Number(row.quantity), reason: row.reason, referenceCostMinor: Number(row.referenceCostMinor), currency: row.currency, actorId: row.actorId, occurredAt: row.occurredAt })) });
  }
}

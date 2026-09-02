import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";
import type { StockTransferRepository, TransferAudit } from "../application/ports/stock-transfer-repository";
import { StockTransfer, StockTransferLine } from "../domain/stock-transfer";

export class PrismaStockTransferRepository implements StockTransferRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async create(transfer: StockTransfer, audit: TransferAudit): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const shops = await tx.shop.findMany({
        where: { id: { in: [transfer.sourceShopId.value, transfer.destinationShopId.value] }, organizationId: transfer.organizationId.value, isActive: true },
        select: { id: true },
      });
      if (shops.length !== 2) throw new DomainError("transfers.shop_not_found", "Both transfer shops must be active in this organization.");
      await tx.stockTransfer.create({ data: { id: transfer.id.value, organizationId: transfer.organizationId.value, sourceShopId: transfer.sourceShopId.value, destinationShopId: transfer.destinationShopId.value, createdByActorId: audit.actorId } });
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), ...audit } });
    });
  }

  public async findDraft(organizationId: string, transferId: string): Promise<StockTransfer | null> {
    const row = await this.prisma.stockTransfer.findFirst({ where: { id: transferId, organizationId, status: "DRAFT" }, include: { lines: true } });
    if (row === null) return null;
    return StockTransfer.draft({
      id: Identifier.fromString(row.id),
      organizationId: Identifier.fromString(row.organizationId),
      sourceShopId: Identifier.fromString(row.sourceShopId),
      destinationShopId: Identifier.fromString(row.destinationShopId),
      lines: row.lines.map((line) => StockTransferLine.create({ id: Identifier.fromString(line.id), productId: Identifier.fromString(line.productId), quantity: Quantity.fromNumber(Number(line.quantity.toString())) })),
    });
  }

  public async saveLine(organizationId: string, transferId: string, line: StockTransferLine, audit: TransferAudit): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findFirst({ where: { id: transferId, organizationId, status: "DRAFT" } });
      if (transfer === null) throw new DomainError("transfers.draft_not_found", "The draft transfer does not belong to this organization.");
      const product = await tx.product.findFirst({ where: { id: line.productId.value, organizationId, isActive: true, trackInventory: true } });
      if (product === null) throw new DomainError("transfers.product_not_found", "The tracked product does not belong to this organization.");
      const existing = await tx.stockTransferLine.findUnique({ where: { stockTransferId_productId: { stockTransferId: transferId, productId: line.productId.value } } });
      if (existing !== null && existing.id !== line.id.value) throw new DomainError("transfers.line_not_found", "The transfer line does not belong to this draft.");
      await tx.stockTransferLine.upsert({
        where: { stockTransferId_productId: { stockTransferId: transferId, productId: line.productId.value } },
        create: { id: line.id.value, stockTransferId: transferId, productId: line.productId.value, quantity: line.quantity.value },
        update: { quantity: line.quantity.value },
      });
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), ...audit } });
    });
  }
}

import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";
import type { StockTransferRepository, TransferAudit } from "../application/ports/stock-transfer-repository";
import { StockTransfer, StockTransferLine, StockTransferShipment } from "../domain/stock-transfer";

type ShipmentRow = Readonly<{
  id: string;
  organizationId: string;
  sourceShopId: string;
  destinationShopId: string;
  shipmentReference: string | null;
  sentByActorId: string | null;
  sentAt: Date | null;
  lines: ReadonlyArray<{ id: string; productId: string; quantity: { toString(): string } }>;
}>;

function shipmentFromRow(row: ShipmentRow): StockTransferShipment {
  if (row.shipmentReference === null || row.sentAt === null) throw new DomainError("transfers.invalid_shipment_state", "Shipment metadata is incomplete.");
  const transfer = StockTransfer.draft({ id: Identifier.fromString(row.id), organizationId: Identifier.fromString(row.organizationId), sourceShopId: Identifier.fromString(row.sourceShopId), destinationShopId: Identifier.fromString(row.destinationShopId), lines: row.lines.map((line) => StockTransferLine.create({ id: Identifier.fromString(line.id), productId: Identifier.fromString(line.productId), quantity: Quantity.fromNumber(Number(line.quantity.toString())) })) });
  return StockTransferShipment.create(transfer, row.shipmentReference, row.sentByActorId, row.sentAt);
}

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

  public async findShipmentByReference(organizationId: string, reference: string): Promise<StockTransferShipment | null> {
    const row = await this.prisma.stockTransfer.findFirst({ where: { organizationId, shipmentReference: reference, status: "SENT" }, include: { lines: true } });
    return row === null ? null : shipmentFromRow(row);
  }

  public async dispatch(shipment: StockTransferShipment): Promise<StockTransferShipment> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.stockTransfer.findFirst({ where: { organizationId: shipment.organizationId.value, shipmentReference: shipment.reference, status: "SENT" }, include: { lines: true } });
      if (existing !== null) {
        if (existing.id !== shipment.transferId.value) throw new DomainError("transfers.shipment_reference_taken", "The shipment reference is already used.");
        return shipmentFromRow(existing);
      }
      const reserved = await tx.stockTransfer.updateMany({ where: { id: shipment.transferId.value, organizationId: shipment.organizationId.value, status: "DRAFT" }, data: { status: "SENDING", shipmentReference: shipment.reference, sentByActorId: shipment.actorId, sentAt: shipment.sentAt } });
      if (reserved.count !== 1) {
        const current = await tx.stockTransfer.findFirst({ where: { id: shipment.transferId.value, organizationId: shipment.organizationId.value }, include: { lines: true } });
        if (current?.status === "SENT" && current.shipmentReference === shipment.reference) return shipmentFromRow(current);
        throw new DomainError("transfers.draft_not_found", "The draft transfer does not belong to this organization.");
      }
      for (const line of shipment.lines) {
        const updated = await tx.stockLevel.updateMany({ where: { organizationId: shipment.organizationId.value, shopId: shipment.sourceShopId.value, productId: line.productId.value, quantity: { gte: line.quantity.value } }, data: { quantity: { decrement: line.quantity.value } } });
        if (updated.count !== 1) {
          const level = await tx.stockLevel.findUnique({ where: { organizationId_shopId_productId: { organizationId: shipment.organizationId.value, shopId: shipment.sourceShopId.value, productId: line.productId.value } } });
          if (level === null) throw new DomainError("transfers.stock_level_not_found", "No source stock level exists for this transfer line.");
          throw new DomainError("transfers.insufficient_stock", "The source stock is insufficient for this transfer line.");
        }
        await tx.stockMovement.create({ data: { id: crypto.randomUUID(), organizationId: shipment.organizationId.value, shopId: shipment.sourceShopId.value, productId: line.productId.value, quantityDelta: -line.quantity.value, reason: `transfer.sent:${shipment.reference}`, actorId: shipment.actorId, idempotencyKey: `transfer-sent:${shipment.transferId.value}:${line.id.value}`, occurredAt: shipment.sentAt } });
      }
      await tx.stockTransfer.update({ where: { id: shipment.transferId.value }, data: { status: "SENT" } });
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: shipment.organizationId.value, actorId: shipment.actorId, action: `transfer.sent:${shipment.transferId.value}:${shipment.reference}` } });
      return shipment;
    });
  }
}

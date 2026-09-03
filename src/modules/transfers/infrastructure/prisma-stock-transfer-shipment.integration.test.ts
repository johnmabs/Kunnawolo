import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CreateStockTransfer } from "../application/create-stock-transfer";
import { SaveStockTransferLine } from "../application/save-stock-transfer-line";
import { SendStockTransfer } from "../application/send-stock-transfer";
import { ReceiveStockTransfer } from "../application/receive-stock-transfer";
import { CancelStockTransfer } from "../application/cancel-stock-transfer";
import { PrismaStockTransferRepository } from "./prisma-stock-transfer-repository";
import { PrismaTransferScope } from "./prisma-transfer-scope";
import { PrismaTransfersDispatchAuthorization } from "./prisma-transfers-dispatch-authorization";
import { PrismaTransfersReceptionAuthorization } from "./prisma-transfers-reception-authorization";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error(
    "DATABASE_URL is required for transfer shipment integration tests.",
  );

const prisma = createPrismaClient(databaseUrl);
const organizationId = "shipment-org";
const sourceShopId = "shipment-source";
const destinationShopId = "shipment-destination";
const productId = "shipment-product";
const managerId = "shipment-manager";
const cashierId = "shipment-cashier";
let nextId = 0;
const ids = { next: () => Identifier.fromString(`shipment-id-${++nextId}`) };
const now = new Date("2026-09-02T08:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.upsert({
    where: { id: organizationId },
    create: { id: organizationId, name: "Expédition Ɛ", currency: "XOF" },
    update: {},
  });
  await prisma.userAccount.createMany({
    data: [
      {
        id: managerId,
        email: "shipment-manager@example.test",
        displayName: "Manager",
      },
      {
        id: cashierId,
        email: "shipment-cashier@example.test",
        displayName: "Cashier",
      },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.upsert({
    where: { id: sourceShopId },
    create: { id: sourceShopId, organizationId, code: "SHP", name: "Source" },
    update: { isActive: true },
  });
  await prisma.shop.upsert({
    where: { id: destinationShopId },
    create: {
      id: destinationShopId,
      organizationId,
      code: "DST",
      name: "Destination",
    },
    update: { isActive: true },
  });
  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userAccountId: {
        organizationId,
        userAccountId: managerId,
      },
    },
    create: {
      id: "shipment-manager-membership",
      organizationId,
      userAccountId: managerId,
      status: "ACTIVE",
      role: "MANAGER",
      activatedAt: now,
    },
    update: { status: "ACTIVE", role: "MANAGER" },
  });
  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userAccountId: {
        organizationId,
        userAccountId: cashierId,
      },
    },
    create: {
      id: "shipment-cashier-membership",
      organizationId,
      userAccountId: cashierId,
      status: "ACTIVE",
      role: "CASHIER",
      activatedAt: now,
    },
    update: { status: "ACTIVE", role: "CASHIER" },
  });
  await prisma.shopAssignment.upsert({
    where: {
      membershipId_shopId: {
        membershipId: "shipment-manager-membership",
        shopId: sourceShopId,
      },
    },
    create: {
      id: "shipment-manager-assignment",
      membershipId: "shipment-manager-membership",
      shopId: sourceShopId,
    },
    update: {},
  });
  await prisma.shopAssignment.upsert({
    where: {
      membershipId_shopId: {
        membershipId: "shipment-manager-membership",
        shopId: destinationShopId,
      },
    },
    create: {
      id: "shipment-manager-destination-assignment",
      membershipId: "shipment-manager-membership",
      shopId: destinationShopId,
    },
    update: {},
  });
  await prisma.product.upsert({
    where: { id: productId },
    create: {
      id: productId,
      organizationId,
      name: "Nsiirin Ɛ",
      trackInventory: true,
    },
    update: { isActive: true, trackInventory: true },
  });
  await prisma.stockLevel.upsert({
    where: {
      organizationId_shopId_productId: {
        organizationId,
        shopId: sourceShopId,
        productId,
      },
    },
    create: {
      id: "shipment-level",
      organizationId,
      shopId: sourceShopId,
      productId,
      quantity: 5,
    },
    update: { quantity: 5 },
  });
});

afterAll(async () => {
  await prisma.stockMovement.deleteMany({ where: { organizationId } });
  await prisma.stockTransferLine.deleteMany({
    where: { stockTransfer: { organizationId } },
  });
  await prisma.stockTransfer.deleteMany({ where: { organizationId } });
  await prisma.stockLevel.deleteMany({ where: { organizationId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.shopAssignment.deleteMany({
    where: {
      id: {
        in: [
          "shipment-manager-assignment",
          "shipment-manager-destination-assignment",
        ],
      },
    },
  });
  await prisma.organizationMembership.deleteMany({
    where: {
      id: {
        in: ["shipment-manager-membership", "shipment-cashier-membership"],
      },
    },
  });
  await prisma.shop.deleteMany({
    where: { id: { in: [sourceShopId, destinationShopId] } },
  });
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.userAccount.deleteMany({
    where: { id: { in: [managerId, cashierId] } },
  });
  await prisma.$disconnect();
});

describe("PrismaStockTransferRepository shipment", () => {
  it("decrements source stock atomically and is idempotent after shop deactivation", async () => {
    const repository = new PrismaStockTransferRepository(prisma);
    const scope = new PrismaTransferScope(prisma);
    const transfer = await new CreateStockTransfer(
      scope,
      repository,
      ids,
    ).execute({
      organizationId,
      sourceShopId,
      destinationShopId,
      actorId: managerId,
    });
    await new SaveStockTransferLine(scope, repository, ids).execute({
      organizationId,
      transferId: transfer.id.value,
      productId,
      quantity: 2,
      actorId: managerId,
    });
    const send = new SendStockTransfer(
      repository,
      new PrismaTransfersDispatchAuthorization(prisma),
      { now: () => now },
    );
    await expect(
      send.execute({
        organizationId,
        transferId: transfer.id.value,
        reference: "EXP-Ɛ",
        actorId: cashierId,
      }),
    ).rejects.toMatchObject({ code: "transfers.dispatch_forbidden" });
    await prisma.shop.update({
      where: { id: sourceShopId },
      data: { isActive: false },
    });
    const shipment = await send.execute({
      organizationId,
      transferId: transfer.id.value,
      reference: "  EXP-Ɛ  ",
      actorId: managerId,
    });
    await expect(
      send.execute({
        organizationId,
        transferId: transfer.id.value,
        reference: "EXP-Ɛ",
        actorId: managerId,
      }),
    ).resolves.toMatchObject({ reference: shipment.reference });
    expect(
      Number(
        (
          await prisma.stockLevel.findUniqueOrThrow({
            where: {
              organizationId_shopId_productId: {
                organizationId,
                shopId: sourceShopId,
                productId,
              },
            },
          })
        ).quantity,
      ),
    ).toBe(3);
    await expect(
      prisma.stockTransfer.findUnique({ where: { id: transfer.id.value } }),
    ).resolves.toMatchObject({
      status: "SENT",
      shipmentReference: "EXP-Ɛ",
      sentAt: now,
    });
    await expect(
      prisma.stockMovement.count({
        where: { organizationId, reason: "transfer.sent:EXP-Ɛ" },
      }),
    ).resolves.toBe(1);
    const receive = new ReceiveStockTransfer(
      repository,
      new PrismaTransfersReceptionAuthorization(prisma),
      { now: () => now },
    );
    await expect(
      receive.execute({
        organizationId,
        transferId: transfer.id.value,
        reference: "REC-Ɛ",
        actorId: cashierId,
      }),
    ).rejects.toMatchObject({ code: "transfers.reception_forbidden" });
    await receive.execute({
      organizationId,
      transferId: transfer.id.value,
      reference: "  REC-Ɛ  ",
      actorId: managerId,
    });
    await receive.execute({
      organizationId,
      transferId: transfer.id.value,
      reference: "REC-Ɛ",
      actorId: managerId,
    });
    expect(
      Number(
        (
          await prisma.stockLevel.findUniqueOrThrow({
            where: {
              organizationId_shopId_productId: {
                organizationId,
                shopId: destinationShopId,
                productId,
              },
            },
          })
        ).quantity,
      ),
    ).toBe(2);
    await expect(
      prisma.stockTransfer.findUnique({ where: { id: transfer.id.value } }),
    ).resolves.toMatchObject({
      status: "RECEIVED",
      receptionReference: "REC-Ɛ",
      receivedAt: now,
    });
    await expect(
      prisma.stockMovement.count({
        where: { organizationId, reason: "transfer.received:REC-Ɛ" },
      }),
    ).resolves.toBe(1);
    await prisma.shop.update({
      where: { id: sourceShopId },
      data: { isActive: true },
    });
    const draft = await new CreateStockTransfer(scope, repository, ids).execute(
      { organizationId, sourceShopId, destinationShopId, actorId: managerId },
    );
    const cancellation = new CancelStockTransfer(
      repository,
      new PrismaTransfersDispatchAuthorization(prisma),
      { now: () => now },
    );
    await expect(
      cancellation.execute({
        organizationId,
        transferId: draft.id.value,
        reference: "ANN-Ɛ",
        reason: "  Écart ɲa  ",
        actorId: cashierId,
      }),
    ).rejects.toMatchObject({ code: "transfers.dispatch_forbidden" });
    await cancellation.execute({
      organizationId,
      transferId: draft.id.value,
      reference: "ANN-Ɛ",
      reason: "  Écart ɲa  ",
      actorId: managerId,
    });
    await cancellation.execute({
      organizationId,
      transferId: draft.id.value,
      reference: "ANN-Ɛ",
      reason: "Écart ɲa",
      actorId: managerId,
    });
    await expect(
      prisma.stockTransfer.findUnique({ where: { id: draft.id.value } }),
    ).resolves.toMatchObject({
      status: "CANCELLED",
      cancellationReason: "Écart ɲa",
    });
  });
});

import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { ReceiveStock } from "@/modules/inventory/application/receive-stock";
import { RecordStockMovement } from "@/modules/inventory/application/record-stock-movement";
import { PrismaStockMovementRepository } from "@/modules/inventory/infrastructure/prisma-stock-movement-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { apiErrorResponse } from "../../../../_shared/api-error";
import { authorizeInventoryShop } from "../../../_shared/inventory-access";
import { getStockDetail } from "../../../_shared/stock-detail";

type ReceiptRequest = Readonly<{
  organizationId?: string;
  shopId?: string;
  quantity?: number;
  reference?: string;
  idempotencyKey?: string;
}>;

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ productId: string }> }>,
) {
  const input = (await request.json()) as ReceiptRequest;
  const organizationId = input.organizationId?.trim();
  const shopId = input.shopId?.trim();
  const reference = input.reference?.trim();
  const idempotencyKey = input.idempotencyKey?.trim();
  if (
    !organizationId ||
    !shopId ||
    !reference ||
    !idempotencyKey ||
    !Number.isFinite(input.quantity)
  )
    return NextResponse.json(
      { code: "inventory.invalid_receipt_request" },
      { status: 400 },
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json(
      { code: "inventory.unavailable" },
      { status: 503 },
    );
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authorizeInventoryShop(
      prisma,
      request,
      organizationId,
      shopId,
    );
    const { productId } = await context.params;
    await new ReceiveStock(
      new RecordStockMovement(
        new PrismaStockMovementRepository(prisma),
        new UuidIdentifierGenerator(),
        new SystemClock(),
      ),
    ).execute({
      organizationId,
      shopId,
      productId,
      quantity: input.quantity as number,
      reference,
      actorId: access.actorId,
      idempotencyKey,
    });
    return NextResponse.json(
      await getStockDetail(prisma, organizationId, shopId, productId),
    );
  } catch (error) {
    return apiErrorResponse(error, "inventory.receipt_failed");
  } finally {
    await prisma.$disconnect();
  }
}

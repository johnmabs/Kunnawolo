import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { RecordStockLoss } from "@/modules/inventory/application/record-stock-loss";
import { PrismaStockLossRepository } from "@/modules/inventory/infrastructure/prisma-stock-loss-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { apiErrorResponse } from "../../../../_shared/api-error";
import { authorizeInventoryShop } from "../../../_shared/inventory-access";
import { getStockDetail } from "../../../_shared/stock-detail";

type LossRequest = Readonly<{
  organizationId?: string;
  shopId?: string;
  quantity?: number;
  reason?: string;
}>;

export async function POST(
  request: Request,
  context: Readonly<{ params: Promise<{ productId: string }> }>,
) {
  const input = (await request.json()) as LossRequest;
  const organizationId = input.organizationId?.trim();
  const shopId = input.shopId?.trim();
  const reason = input.reason?.trim();
  if (!organizationId || !shopId || !reason || !Number.isFinite(input.quantity))
    return NextResponse.json(
      { code: "inventory.invalid_loss_request" },
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
    const detail = await getStockDetail(
      prisma,
      organizationId,
      shopId,
      productId,
    );
    await new RecordStockLoss(
      new PrismaStockLossRepository(prisma),
      new UuidIdentifierGenerator(),
      new SystemClock(),
    ).execute({
      organizationId,
      shopId,
      productId,
      quantity: input.quantity as number,
      reason,
      referenceCostMinor: detail.referenceCostMinor,
      currency: detail.currency,
      actorId: access.actorId,
    });
    return NextResponse.json(
      await getStockDetail(prisma, organizationId, shopId, productId),
    );
  } catch (error) {
    return apiErrorResponse(error, "inventory.loss_failed");
  } finally {
    await prisma.$disconnect();
  }
}

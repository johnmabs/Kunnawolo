import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { SetLowStockThreshold } from "@/modules/inventory/application/set-low-stock-threshold";
import { PrismaStockLevelRepository } from "@/modules/inventory/infrastructure/prisma-stock-level-repository";
import { apiErrorResponse } from "../../../../_shared/api-error";
import { authorizeInventoryShop } from "../../../_shared/inventory-access";
import { getStockDetail } from "../../../_shared/stock-detail";

type ThresholdRequest = Readonly<{
  organizationId?: string;
  shopId?: string;
  threshold?: number;
}>;

export async function PUT(
  request: Request,
  context: Readonly<{ params: Promise<{ productId: string }> }>,
) {
  const input = (await request.json()) as ThresholdRequest;
  const organizationId = input.organizationId?.trim();
  const shopId = input.shopId?.trim();
  if (!organizationId || !shopId || !Number.isFinite(input.threshold))
    return NextResponse.json(
      { code: "inventory.invalid_threshold_request" },
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
    await new SetLowStockThreshold(
      new PrismaStockLevelRepository(prisma),
    ).execute({
      organizationId,
      shopId,
      productId,
      threshold: input.threshold as number,
      actorId: access.actorId,
    });
    return NextResponse.json(
      await getStockDetail(prisma, organizationId, shopId, productId),
    );
  } catch (error) {
    return apiErrorResponse(error, "inventory.threshold_failed");
  } finally {
    await prisma.$disconnect();
  }
}

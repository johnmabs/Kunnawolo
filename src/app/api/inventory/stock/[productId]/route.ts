import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { apiErrorResponse } from "../../../_shared/api-error";
import { authorizeInventoryShop } from "../../_shared/inventory-access";
import { getStockDetail } from "../../_shared/stock-detail";

export async function GET(
  request: Request,
  context: Readonly<{ params: Promise<{ productId: string }> }>,
) {
  const search = new URL(request.url).searchParams;
  const organizationId = search.get("organizationId")?.trim();
  const shopId = search.get("shopId")?.trim();
  if (!organizationId || !shopId)
    return NextResponse.json(
      { code: "inventory.invalid_stock_request" },
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
    await authorizeInventoryShop(prisma, request, organizationId, shopId);
    const { productId } = await context.params;
    return NextResponse.json(
      await getStockDetail(prisma, organizationId, shopId, productId),
    );
  } catch (error) {
    return apiErrorResponse(error, "inventory.stock_detail_failed");
  } finally {
    await prisma.$disconnect();
  }
}

import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ListStock } from "@/modules/inventory/application/list-stock";
import { PrismaInventoryProjectionRepository } from "@/modules/inventory/infrastructure/prisma-inventory-projection-repository";
import { apiErrorResponse } from "../../_shared/api-error";
import { authorizeInventoryShop } from "../_shared/inventory-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const organizationId = search.get("organizationId")?.trim();
  const shopId = search.get("shopId")?.trim();
  if (!organizationId || !shopId) return NextResponse.json({ code: "inventory.invalid_stock_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "inventory.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    await authorizeInventoryShop(prisma, request, organizationId, shopId);
    const projection = await new ListStock(new PrismaInventoryProjectionRepository(prisma)).execute({ organizationId, shopId, productSearch: search.get("query") });
    return NextResponse.json({ shopId: projection.shopId.value, shopName: projection.shopName, items: projection.items });
  } catch (error) {
    return apiErrorResponse(error, "inventory.stock_list_failed");
  } finally {
    await prisma.$disconnect();
  }
}

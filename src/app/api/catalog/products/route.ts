import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { SearchProducts } from "@/modules/catalog/application/search-products";
import { PrismaProductRepository } from "@/modules/catalog/infrastructure/prisma-product-repository";
import { authenticateApiRequest } from "../../_shared/api-access";
import { apiErrorResponse } from "../../_shared/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const organizationId = search.get("organizationId")?.trim();
  if (!organizationId) return NextResponse.json({ code: "catalog.invalid_product_search" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "catalog.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);

  try {
    await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const products = await new SearchProducts(new PrismaProductRepository(prisma)).execute({ organizationId, query: search.get("query") ?? "", includeInactive: false });
    return NextResponse.json({
      items: products.map((product) => ({
        barcode: product.barcode,
        code: product.code,
        id: product.id.value,
        name: product.name,
        trackInventory: product.trackInventory,
      })),
      pricingAvailable: false,
    });
  } catch (error) {
    return apiErrorResponse(error, "catalog.product_search_failed");
  } finally {
    await prisma.$disconnect();
  }
}

import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { SearchProducts } from "@/modules/catalog/application/search-products";
import { CreateProduct } from "@/modules/catalog/application/create-product";
import { PrismaProductRepository } from "@/modules/catalog/infrastructure/prisma-product-repository";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { authenticateApiRequest } from "../../_shared/api-access";
import { apiErrorResponse } from "../../_shared/api-error";
import { productDto } from "../_shared/product-dto";

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
    const products = await new SearchProducts(new PrismaProductRepository(prisma)).execute({ organizationId, query: search.get("query") ?? "", includeInactive: search.get("includeInactive") === "true" });
    return NextResponse.json({
      items: products.map(productDto),
      pricingAvailable: false,
    });
  } catch (error) {
    return apiErrorResponse(error, "catalog.product_search_failed");
  } finally {
    await prisma.$disconnect();
  }
}

type CreateProductRequest = Readonly<{ organizationId?: string; name?: string; code?: string | null; barcode?: string | null; packaging?: string | null; form?: string | null; trackInventory?: boolean }>;

export async function POST(request: Request) {
  const input = await request.json() as CreateProductRequest;
  const organizationId = input.organizationId?.trim();
  if (!organizationId || typeof input.name !== "string") return NextResponse.json({ code: "catalog.invalid_product_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "catalog.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const product = await new CreateProduct(new PrismaProductRepository(prisma), new UuidIdentifierGenerator()).execute({
      organizationId,
      actorId: access.actorId,
      name: input.name,
      code: input.code,
      barcode: input.barcode,
      packaging: input.packaging,
      form: input.form,
      trackInventory: input.trackInventory,
    });
    return NextResponse.json(productDto(product), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "catalog.product_creation_failed");
  } finally {
    await prisma.$disconnect();
  }
}

import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { GetProduct } from "@/modules/catalog/application/get-product";
import { ActivateProduct } from "@/modules/catalog/application/activate-product";
import { DeactivateProduct } from "@/modules/catalog/application/deactivate-product";
import { PrismaProductRepository } from "@/modules/catalog/infrastructure/prisma-product-repository";
import { PrismaProductPricingRepository } from "@/modules/catalog/infrastructure/prisma-product-pricing-repository";
import { PrismaOrganizationRepository } from "@/modules/organization/infrastructure/prisma-organization-repository";
import { authenticateApiRequest } from "../../../_shared/api-access";
import { apiErrorResponse } from "../../../_shared/api-error";
import { pricingDto, productDto } from "../../_shared/product-dto";

async function context(request: Request) {
  const organizationId = new URL(request.url).searchParams
    .get("organizationId")
    ?.trim();
  if (!organizationId) return null;
  return { organizationId };
}

export async function GET(
  request: Request,
  route: Readonly<{ params: Promise<{ productId: string }> }>,
) {
  const scope = await context(request);
  if (scope === null)
    return NextResponse.json(
      { code: "catalog.invalid_product_request" },
      { status: 400 },
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "catalog.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    await authenticateApiRequest(
      prisma,
      request.headers.get("authorization"),
      scope.organizationId,
    );
    const { productId } = await route.params;
    const products = new PrismaProductRepository(prisma);
    const [product, pricing, organization] = await Promise.all([
      new GetProduct(products).execute({
        organizationId: scope.organizationId,
        productId,
      }),
      new PrismaProductPricingRepository(prisma).findCurrent(
        scope.organizationId,
        productId,
      ),
      new PrismaOrganizationRepository(prisma).findById(scope.organizationId),
    ]);
    if (organization === null)
      return NextResponse.json(
        { code: "organization.not_found" },
        { status: 404 },
      );
    return NextResponse.json({
      ...productDto(product),
      pricing: pricingDto(pricing, organization.currency),
    });
  } catch (error) {
    return apiErrorResponse(error, "catalog.product_detail_failed");
  } finally {
    await prisma.$disconnect();
  }
}

type LifecycleRequest = Readonly<{
  organizationId?: string;
  isActive?: boolean;
}>;

export async function PATCH(
  request: Request,
  route: Readonly<{ params: Promise<{ productId: string }> }>,
) {
  const input = (await request.json()) as LifecycleRequest;
  const organizationId = input.organizationId?.trim();
  if (!organizationId || typeof input.isActive !== "boolean")
    return NextResponse.json(
      { code: "catalog.invalid_lifecycle_request" },
      { status: 400 },
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "catalog.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(
      prisma,
      request.headers.get("authorization"),
      organizationId,
    );
    const { productId } = await route.params;
    const products = new PrismaProductRepository(prisma);
    const product = input.isActive
      ? await new ActivateProduct(products).execute({
          organizationId,
          productId,
          actorId: access.actorId,
        })
      : await new DeactivateProduct(products).execute({
          organizationId,
          productId,
          actorId: access.actorId,
        });
    return NextResponse.json(productDto(product));
  } catch (error) {
    return apiErrorResponse(error, "catalog.product_lifecycle_failed");
  } finally {
    await prisma.$disconnect();
  }
}

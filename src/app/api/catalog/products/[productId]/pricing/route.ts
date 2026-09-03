import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { SetProductPricing } from "@/modules/catalog/application/set-product-pricing";
import { PrismaProductRepository } from "@/modules/catalog/infrastructure/prisma-product-repository";
import { PrismaProductPricingRepository } from "@/modules/catalog/infrastructure/prisma-product-pricing-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateApiRequest } from "../../../../_shared/api-access";
import { apiErrorResponse } from "../../../../_shared/api-error";
import { pricingDto } from "../../../_shared/product-dto";

type PricingRequest = Readonly<{
  organizationId?: string;
  referenceCostMinor?: number;
  salePriceMinor?: number;
  currency?: string;
  reference?: string;
}>;

export async function POST(
  request: Request,
  route: Readonly<{ params: Promise<{ productId: string }> }>,
) {
  const input = (await request.json()) as PricingRequest;
  const organizationId = input.organizationId?.trim();
  const currency = input.currency?.trim();
  const reference = input.reference?.trim();
  if (
    !organizationId ||
    !currency ||
    !reference ||
    !Number.isSafeInteger(input.referenceCostMinor) ||
    !Number.isSafeInteger(input.salePriceMinor)
  )
    return NextResponse.json(
      { code: "catalog.invalid_pricing_request" },
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
    const pricing = await new SetProductPricing(
      new PrismaProductRepository(prisma),
      new PrismaProductPricingRepository(prisma),
      new UuidIdentifierGenerator(),
      new SystemClock(),
    ).execute({
      organizationId,
      productId,
      referenceCostMinor: input.referenceCostMinor as number,
      salePriceMinor: input.salePriceMinor as number,
      currency,
      reference,
      actorId: access.actorId,
    });
    return NextResponse.json(pricingDto(pricing, currency), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "catalog.product_pricing_failed");
  } finally {
    await prisma.$disconnect();
  }
}

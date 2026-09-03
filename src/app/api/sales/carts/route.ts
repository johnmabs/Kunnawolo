import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { CreateSaleCart } from "@/modules/sales/application/create-sale-cart";
import { PrismaSaleCartRepository } from "@/modules/sales/infrastructure/prisma-sale-cart-repository";
import { PrismaSalesScope } from "@/modules/sales/infrastructure/prisma-sales-scope";
import { PrismaWorkspacePreferenceAuthorization } from "@/modules/identity-access/infrastructure/prisma-workspace-preference-authorization";
import { authenticateApiRequest } from "../../_shared/api-access";
import { apiErrorResponse } from "../../_shared/api-error";
import { toSaleCartDto } from "../_shared/sale-dto";

type CreateCartRequest = Readonly<{ organizationId?: string; shopId?: string }>;

export async function POST(request: Request) {
  const input = (await request.json()) as CreateCartRequest;
  const organizationId = input.organizationId?.trim();
  const shopId = input.shopId?.trim();
  if (!organizationId || !shopId)
    return NextResponse.json(
      { code: "sales.invalid_cart_request" },
      { status: 400 },
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "sales.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);

  try {
    const access = await authenticateApiRequest(
      prisma,
      request.headers.get("authorization"),
      organizationId,
    );
    await new PrismaWorkspacePreferenceAuthorization(prisma).authorize(
      organizationId,
      access.actorId,
      shopId,
    );
    const cart = await new CreateSaleCart(
      new PrismaSalesScope(prisma),
      new PrismaSaleCartRepository(prisma),
      new UuidIdentifierGenerator(),
    ).execute({ organizationId, shopId, actorId: access.actorId });
    return NextResponse.json(toSaleCartDto(cart), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "sales.cart_creation_failed");
  } finally {
    await prisma.$disconnect();
  }
}

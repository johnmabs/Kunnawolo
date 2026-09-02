import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { GetSaleCart } from "@/modules/sales/application/get-sale-cart";
import { PrismaSaleCartRepository } from "@/modules/sales/infrastructure/prisma-sale-cart-repository";
import { authenticateApiRequest } from "../../../_shared/api-access";
import { apiErrorResponse } from "../../../_shared/api-error";
import { toSaleCartDto } from "../../_shared/sale-dto";

export async function GET(request: Request, context: Readonly<{ params: Promise<{ cartId: string }> }>) {
  const organizationId = new URL(request.url).searchParams.get("organizationId")?.trim();
  if (!organizationId) return NextResponse.json({ code: "sales.invalid_cart_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "sales.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);

  try {
    await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const { cartId } = await context.params;
    const cart = await new GetSaleCart(new PrismaSaleCartRepository(prisma)).execute({ organizationId, cartId });
    return NextResponse.json(toSaleCartDto(cart));
  } catch (error) {
    return apiErrorResponse(error, "sales.cart_read_failed");
  } finally {
    await prisma.$disconnect();
  }
}

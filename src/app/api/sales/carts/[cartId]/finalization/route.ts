import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { FinalizeSaleCart } from "@/modules/sales/application/finalize-sale-cart";
import { PrismaSaleCartRepository } from "@/modules/sales/infrastructure/prisma-sale-cart-repository";
import { PrismaSaleFinalizationRepository } from "@/modules/sales/infrastructure/prisma-sale-finalization-repository";
import { PrismaWorkspacePreferenceAuthorization } from "@/modules/identity-access/infrastructure/prisma-workspace-preference-authorization";
import { GetSaleCart } from "@/modules/sales/application/get-sale-cart";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateApiRequest } from "../../../../_shared/api-access";
import { apiErrorResponse } from "../../../../_shared/api-error";
import { toSaleFinalizationDto } from "../../../_shared/sale-dto";

type FinalizeRequest = Readonly<{ organizationId?: string; reference?: string; underCostReason?: string | null }>;

export async function POST(request: Request, context: Readonly<{ params: Promise<{ cartId: string }> }>) {
  const input = await request.json() as FinalizeRequest;
  const organizationId = input.organizationId?.trim();
  const reference = input.reference?.trim();
  if (!organizationId || !reference) return NextResponse.json({ code: "sales.invalid_finalization_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "sales.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);

  try {
    const access = await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const { cartId } = await context.params;
    const carts = new PrismaSaleCartRepository(prisma);
    const cart = await new GetSaleCart(carts).execute({ organizationId, cartId });
    await new PrismaWorkspacePreferenceAuthorization(prisma).authorize(organizationId, access.actorId, cart.shopId.value);
    const finalization = await new FinalizeSaleCart(carts, new PrismaSaleFinalizationRepository(prisma), new SystemClock()).execute({ organizationId, cartId, reference, actorId: access.actorId, underCostReason: input.underCostReason });
    return NextResponse.json(toSaleFinalizationDto(finalization));
  } catch (error) {
    return apiErrorResponse(error, "sales.finalization_failed");
  } finally {
    await prisma.$disconnect();
  }
}

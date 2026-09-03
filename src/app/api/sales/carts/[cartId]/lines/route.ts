import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { GetSaleCart } from "@/modules/sales/application/get-sale-cart";
import { RemoveSaleLine } from "@/modules/sales/application/remove-sale-line";
import { SaveSaleLine } from "@/modules/sales/application/save-sale-line";
import { PrismaSaleCartRepository } from "@/modules/sales/infrastructure/prisma-sale-cart-repository";
import { PrismaSalesScope } from "@/modules/sales/infrastructure/prisma-sales-scope";
import { PrismaWorkspacePreferenceAuthorization } from "@/modules/identity-access/infrastructure/prisma-workspace-preference-authorization";
import { authenticateApiRequest } from "../../../../_shared/api-access";
import { apiErrorResponse } from "../../../../_shared/api-error";
import { toSaleCartDto } from "../../../_shared/sale-dto";

type SaveLineRequest = Readonly<{
  organizationId?: string;
  lineId?: string;
  productId?: string;
  quantity?: number;
  discountMinor?: number;
}>;
type RemoveLineRequest = Readonly<{ organizationId?: string; lineId?: string }>;
type RouteContext = Readonly<{ params: Promise<{ cartId: string }> }>;

async function saveLine(
  request: Request,
  context: RouteContext,
  updating: boolean,
) {
  const input = (await request.json()) as SaveLineRequest;
  const organizationId = input.organizationId?.trim();
  const productId = input.productId?.trim();
  if (
    !organizationId ||
    !productId ||
    !Number.isFinite(input.quantity) ||
    !Number.isSafeInteger(input.discountMinor) ||
    (updating && !input.lineId?.trim())
  )
    return NextResponse.json(
      { code: "sales.invalid_line_request" },
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
    const { cartId } = await context.params;
    const carts = new PrismaSaleCartRepository(prisma);
    const currentCart = await new GetSaleCart(carts).execute({
      organizationId,
      cartId,
    });
    await new PrismaWorkspacePreferenceAuthorization(prisma).authorize(
      organizationId,
      access.actorId,
      currentCart.shopId.value,
    );
    await new SaveSaleLine(
      new PrismaSalesScope(prisma),
      carts,
      new UuidIdentifierGenerator(),
    ).execute({
      organizationId,
      cartId,
      ...(updating ? { lineId: input.lineId?.trim() } : {}),
      productId,
      quantity: input.quantity as number,
      discountMinor: input.discountMinor as number,
      actorId: access.actorId,
    });
    return NextResponse.json(
      toSaleCartDto(
        await new GetSaleCart(carts).execute({ organizationId, cartId }),
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, "sales.line_save_failed");
  } finally {
    await prisma.$disconnect();
  }
}

export function POST(request: Request, context: RouteContext) {
  return saveLine(request, context, false);
}

export function PUT(request: Request, context: RouteContext) {
  return saveLine(request, context, true);
}

export async function DELETE(request: Request, context: RouteContext) {
  const input = (await request.json()) as RemoveLineRequest;
  const organizationId = input.organizationId?.trim();
  const lineId = input.lineId?.trim();
  if (!organizationId || !lineId)
    return NextResponse.json(
      { code: "sales.invalid_line_request" },
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
    const { cartId } = await context.params;
    const carts = new PrismaSaleCartRepository(prisma);
    const currentCart = await new GetSaleCart(carts).execute({
      organizationId,
      cartId,
    });
    await new PrismaWorkspacePreferenceAuthorization(prisma).authorize(
      organizationId,
      access.actorId,
      currentCart.shopId.value,
    );
    await new RemoveSaleLine(carts).execute({
      organizationId,
      cartId,
      lineId,
      actorId: access.actorId,
    });
    return NextResponse.json(
      toSaleCartDto(
        await new GetSaleCart(carts).execute({ organizationId, cartId }),
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, "sales.line_removal_failed");
  } finally {
    await prisma.$disconnect();
  }
}

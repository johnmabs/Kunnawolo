import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { SaveStockTransferLine } from "@/modules/transfers/application/save-stock-transfer-line";
import { PrismaStockTransferRepository } from "@/modules/transfers/infrastructure/prisma-stock-transfer-repository";
import { PrismaTransferScope } from "@/modules/transfers/infrastructure/prisma-transfer-scope";
import { PrismaTransfersDispatchAuthorization } from "@/modules/transfers/infrastructure/prisma-transfers-dispatch-authorization";
import { authenticateApiRequest } from "../../../_shared/api-access";
import { apiErrorResponse } from "../../../_shared/api-error";

type LineRequest = Readonly<{ organizationId?: string; productId?: string; quantity?: number }>;

export async function PUT(request: Request, context: Readonly<{ params: Promise<{ transferId: string }> }>) {
  const input = await request.json() as LineRequest;
  const organizationId = input.organizationId?.trim();
  const productId = input.productId?.trim();
  if (!organizationId || !productId || !Number.isFinite(input.quantity)) return NextResponse.json({ code: "transfers.invalid_line_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "transfers.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const { transferId } = await context.params;
    const transfers = new PrismaStockTransferRepository(prisma);
    const draft = await transfers.findDraft(organizationId, transferId);
    if (draft === null) return NextResponse.json({ code: "transfers.draft_not_found" }, { status: 404 });
    await new PrismaTransfersDispatchAuthorization(prisma).authorize(organizationId, draft.sourceShopId.value, access.actorId);
    await new SaveStockTransferLine(new PrismaTransferScope(prisma), transfers, new UuidIdentifierGenerator()).execute({ organizationId, transferId, productId, quantity: input.quantity as number, actorId: access.actorId });
    return NextResponse.json({ success: true });
  } catch (error) { return apiErrorResponse(error, "transfers.line_save_failed"); }
  finally { await prisma.$disconnect(); }
}

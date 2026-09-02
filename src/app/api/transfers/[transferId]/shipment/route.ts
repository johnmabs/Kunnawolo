import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { SendStockTransfer } from "@/modules/transfers/application/send-stock-transfer";
import { PrismaStockTransferRepository } from "@/modules/transfers/infrastructure/prisma-stock-transfer-repository";
import { PrismaTransfersDispatchAuthorization } from "@/modules/transfers/infrastructure/prisma-transfers-dispatch-authorization";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateApiRequest } from "../../../_shared/api-access";
import { apiErrorResponse } from "../../../_shared/api-error";

type ShipmentRequest = Readonly<{ organizationId?: string; reference?: string }>;
export async function POST(request: Request, context: Readonly<{ params: Promise<{ transferId: string }> }>) {
  const input = await request.json() as ShipmentRequest;
  const organizationId = input.organizationId?.trim(); const reference = input.reference?.trim();
  if (!organizationId || !reference) return NextResponse.json({ code: "transfers.invalid_shipment_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "transfers.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const { transferId } = await context.params;
    await new SendStockTransfer(new PrismaStockTransferRepository(prisma), new PrismaTransfersDispatchAuthorization(prisma), new SystemClock()).execute({ organizationId, transferId, reference, actorId: access.actorId });
    return NextResponse.json({ success: true });
  } catch (error) { return apiErrorResponse(error, "transfers.shipment_failed"); }
  finally { await prisma.$disconnect(); }
}

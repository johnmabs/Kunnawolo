import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ReceiveStockTransfer } from "@/modules/transfers/application/receive-stock-transfer";
import { PrismaStockTransferRepository } from "@/modules/transfers/infrastructure/prisma-stock-transfer-repository";
import { PrismaTransfersReceptionAuthorization } from "@/modules/transfers/infrastructure/prisma-transfers-reception-authorization";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateApiRequest } from "../../../_shared/api-access";
import { apiErrorResponse } from "../../../_shared/api-error";

type ReceptionRequest = Readonly<{ organizationId?: string; reference?: string }>;
export async function POST(request: Request, context: Readonly<{ params: Promise<{ transferId: string }> }>) {
  const input = await request.json() as ReceptionRequest;
  const organizationId = input.organizationId?.trim(); const reference = input.reference?.trim();
  if (!organizationId || !reference) return NextResponse.json({ code: "transfers.invalid_reception_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "transfers.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const { transferId } = await context.params;
    await new ReceiveStockTransfer(new PrismaStockTransferRepository(prisma), new PrismaTransfersReceptionAuthorization(prisma), new SystemClock()).execute({ organizationId, transferId, reference, actorId: access.actorId });
    return NextResponse.json({ success: true });
  } catch (error) { return apiErrorResponse(error, "transfers.reception_failed"); }
  finally { await prisma.$disconnect(); }
}

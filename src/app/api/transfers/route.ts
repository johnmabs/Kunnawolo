import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ListStockTransfers } from "@/modules/transfers/application/list-stock-transfers";
import { PrismaStockTransferProjectionRepository } from "@/modules/transfers/infrastructure/prisma-stock-transfer-projection-repository";
import { PrismaWorkspacePreferenceAuthorization } from "@/modules/identity-access/infrastructure/prisma-workspace-preference-authorization";
import { authenticateApiRequest } from "../_shared/api-access";
import { apiErrorResponse } from "../_shared/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const organizationId = search.get("organizationId")?.trim();
  const shopId = search.get("shopId")?.trim();
  if (!organizationId || !shopId) return NextResponse.json({ code: "transfers.invalid_list_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "transfers.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    await new PrismaWorkspacePreferenceAuthorization(prisma).authorize(organizationId, access.actorId, shopId);
    const projection = await new ListStockTransfers(new PrismaStockTransferProjectionRepository(prisma)).execute({ organizationId, shopId });
    return NextResponse.json({ items: projection.items });
  } catch (error) { return apiErrorResponse(error, "transfers.list_failed"); }
  finally { await prisma.$disconnect(); }
}

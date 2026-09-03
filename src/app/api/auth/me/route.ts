import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { apiErrorResponse } from "../../_shared/api-error";
import { authenticateWebRequest } from "../_shared/web-session-access";
import { queryWorkspaceSession } from "@/modules/identity-access/infrastructure/prisma-workspace-session-query";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "auth.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    return NextResponse.json(await queryWorkspaceSession(prisma, account));
  } catch (error) { return apiErrorResponse(error, "auth.session_read_failed"); }
  finally { await prisma.$disconnect(); }
}

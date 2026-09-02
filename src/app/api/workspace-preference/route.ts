import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { SaveWorkspacePreference } from "@/modules/identity-access/application/save-workspace-preference";
import { PrismaWorkspacePreferenceAuthorization } from "@/modules/identity-access/infrastructure/prisma-workspace-preference-authorization";
import { PrismaWorkspacePreferenceRepository } from "@/modules/identity-access/infrastructure/prisma-workspace-preference-repository";
import { authenticateReportRequest } from "../reports/report-api-access";

type PreferenceRequest = Readonly<{ organizationId?: string; shopId?: string | null; isCompact?: boolean }>;

export async function PUT(request: Request) {
  const input = await request.json() as PreferenceRequest;
  if (input.organizationId === undefined) return NextResponse.json({ code: "workspace.invalid_preference" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "workspace.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateReportRequest(prisma, request.headers.get("authorization"), input.organizationId);
    const preference = await new SaveWorkspacePreference(new PrismaWorkspacePreferenceRepository(prisma), new PrismaWorkspacePreferenceAuthorization(prisma)).execute({ organizationId: input.organizationId, actorId: access.actorId, shopId: input.shopId, isCompact: input.isCompact });
    return NextResponse.json({ shopId: preference.shopId?.value ?? null, isCompact: preference.isCompact });
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "workspace.preference_failed";
    return NextResponse.json({ code }, { status: code.startsWith("security.") ? 401 : 400 });
  } finally {
    await prisma.$disconnect();
  }
}

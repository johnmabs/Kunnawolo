import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { PrismaOrganizationRepository } from "@/modules/organization/infrastructure/prisma-organization-repository";
import { authenticateApiRequest } from "../../_shared/api-access";
import { apiErrorResponse } from "../../_shared/api-error";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const organizationId = new URL(request.url).searchParams.get("organizationId")?.trim();
  if (!organizationId) return NextResponse.json({ code: "organization.invalid_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "organization.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const organization = await new PrismaOrganizationRepository(prisma).findById(organizationId);
    if (organization === null) return NextResponse.json({ code: "organization.not_found" }, { status: 404 });
    return NextResponse.json({ id: organization.id.value, name: organization.name, currency: organization.currency });
  } catch (error) { return apiErrorResponse(error, "organization.read_failed"); }
  finally { await prisma.$disconnect(); }
}

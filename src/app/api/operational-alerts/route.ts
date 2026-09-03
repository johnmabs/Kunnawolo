import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ListOperationalAlerts } from "@/modules/observability/application/list-operational-alerts";
import { PrismaOperationalAlertReadAuthorization } from "@/modules/observability/infrastructure/prisma-operational-alert-read-authorization";
import { PrismaOperationalAlertRepository } from "@/modules/observability/infrastructure/prisma-operational-alert-repository";
import { authenticateApiRequest } from "../_shared/api-access";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const organizationId = search.get("organizationId");
  if (organizationId === null)
    return NextResponse.json(
      { code: "observability.invalid_alert_request" },
      { status: 400 },
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json(
      { code: "observability.unavailable" },
      { status: 503 },
    );
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(
      prisma,
      request.headers.get("authorization"),
      organizationId,
    );
    const limit = search.get("limit");
    const page = await new ListOperationalAlerts(
      new PrismaOperationalAlertRepository(prisma),
      new PrismaOperationalAlertReadAuthorization(prisma),
    ).execute({
      organizationId,
      actorId: access.actorId,
      shopId: search.get("shopId"),
      limit: limit === null ? null : Number(limit),
      cursor: search.get("cursor"),
    });
    return NextResponse.json(page);
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String(error.code)
        : "observability.alerts_failed";
    return NextResponse.json(
      { code },
      { status: code.startsWith("security.") ? 401 : 400 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

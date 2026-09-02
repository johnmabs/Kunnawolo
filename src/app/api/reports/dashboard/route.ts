import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { PrismaExpensesReportingSource } from "@/modules/expenses/infrastructure/prisma-expenses-reporting-source";
import { PrismaInventoryReportingSource } from "@/modules/inventory/infrastructure/prisma-inventory-reporting-source";
import { PrismaValuedLossReportingSource } from "@/modules/inventory/infrastructure/prisma-valued-loss-reporting-source";
import { ViewDashboard } from "@/modules/reporting/application/view-dashboard";
import { PrismaReportingReadAuthorization } from "@/modules/reporting/infrastructure/prisma-reporting-read-authorization";
import { PrismaSalesReportingSource } from "@/modules/sales/infrastructure/prisma-sales-reporting-source";
import { PrismaTransfersReportingSource } from "@/modules/transfers/infrastructure/prisma-transfers-reporting-source";

export const dynamic = "force-dynamic";

const toDate = (value: string | null): Date | null => value === null ? null : new Date(value);

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const organizationId = search.get("organizationId");
  const actorId = search.get("actorId");
  if (organizationId === null || actorId === null) return NextResponse.json({ code: "reporting.invalid_dashboard_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "reporting.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const dashboard = await new ViewDashboard(
      new PrismaSalesReportingSource(prisma),
      new PrismaInventoryReportingSource(prisma),
      new PrismaTransfersReportingSource(prisma),
      new PrismaExpensesReportingSource(prisma),
      new PrismaValuedLossReportingSource(prisma),
      new PrismaReportingReadAuthorization(prisma),
    ).execute({ organizationId, actorId, shopId: search.get("shopId"), occurredFrom: toDate(search.get("occurredFrom")), occurredTo: toDate(search.get("occurredTo")) });
    return NextResponse.json(dashboard);
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "reporting.dashboard_failed";
    return NextResponse.json({ code }, { status: 400 });
  } finally {
    await prisma.$disconnect();
  }
}

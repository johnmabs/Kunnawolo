import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { PrismaExpensesReportingSource } from "@/modules/expenses/infrastructure/prisma-expenses-reporting-source";
import { PrismaInventoryReportingSource } from "@/modules/inventory/infrastructure/prisma-inventory-reporting-source";
import { PrismaValuedLossReportingSource } from "@/modules/inventory/infrastructure/prisma-valued-loss-reporting-source";
import { PrismaSalesReportingSource } from "@/modules/sales/infrastructure/prisma-sales-reporting-source";
import { PrismaTransfersReportingSource } from "@/modules/transfers/infrastructure/prisma-transfers-reporting-source";
import { ExportDashboardCsv } from "@/modules/reporting/application/export-dashboard-csv";
import { ViewDashboard } from "@/modules/reporting/application/view-dashboard";
import { PrismaReportExportRepository } from "@/modules/reporting/infrastructure/prisma-report-export-repository";
import { PrismaReportingReadAuthorization } from "@/modules/reporting/infrastructure/prisma-reporting-read-authorization";
import { authenticateReportRequest } from "../../report-api-access";

export const dynamic = "force-dynamic";

type ExportRequest = Readonly<{ organizationId?: string; shopId?: string | null; occurredFrom?: string | null; occurredTo?: string | null; reference?: string }>;

const toDate = (value: string | null | undefined): Date | null => value === null || value === undefined ? null : new Date(value);

export async function POST(request: Request) {
  const input = await request.json() as ExportRequest;
  if (input.organizationId === undefined || input.reference === undefined) return NextResponse.json({ code: "reporting.invalid_export_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "reporting.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const exportDashboard = new ExportDashboardCsv(
      new ViewDashboard(
        new PrismaSalesReportingSource(prisma),
        new PrismaInventoryReportingSource(prisma),
        new PrismaTransfersReportingSource(prisma),
        new PrismaExpensesReportingSource(prisma),
        new PrismaValuedLossReportingSource(prisma),
        new PrismaReportingReadAuthorization(prisma),
      ),
      new PrismaReportExportRepository(prisma),
      new UuidIdentifierGenerator(),
      new SystemClock(),
    );
    const access = await authenticateReportRequest(prisma, request.headers.get("authorization"), input.organizationId);
    const reportExport = await exportDashboard.execute({ organizationId: input.organizationId, shopId: input.shopId, occurredFrom: toDate(input.occurredFrom), occurredTo: toDate(input.occurredTo), actorId: access.actorId, reference: input.reference });
    return new NextResponse(reportExport.content, { status: 201, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${reportExport.reference}.csv"` } });
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "reporting.export_failed";
    return NextResponse.json({ code }, { status: code.startsWith("security.") ? 401 : 400 });
  } finally {
    await prisma.$disconnect();
  }
}

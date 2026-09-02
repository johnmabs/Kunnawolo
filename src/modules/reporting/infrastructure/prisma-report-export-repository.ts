import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DashboardFilter } from "../domain/dashboard-filter";
import { ReportExport } from "../domain/report-export";
import type { ReportExportRepository } from "../application/ports/report-export-repository";

export class PrismaReportExportRepository implements ReportExportRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findByReference(organizationId: string, reference: string): Promise<ReportExport | null> {
    const row = await this.prisma.reportExport.findUnique({ where: { organizationId_reference: { organizationId, reference } } });
    if (row === null) return null;
    return ReportExport.create({ id: row.id, filter: DashboardFilter.create({ organizationId: row.organizationId, shopId: row.shopId, occurredFrom: row.occurredFrom, occurredTo: row.occurredTo }), reference: row.reference, actorId: row.actorId, content: row.content, exportedAt: row.exportedAt });
  }

  public async save(reportExport: ReportExport): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.reportExport.create({ data: { id: reportExport.id.value, organizationId: reportExport.filter.organizationId.value, shopId: reportExport.filter.shopId?.value ?? null, format: "CSV", reference: reportExport.reference, actorId: reportExport.actorId.value, occurredFrom: reportExport.filter.occurredFrom, occurredTo: reportExport.filter.occurredTo, content: reportExport.content, exportedAt: reportExport.exportedAt } });
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: reportExport.filter.organizationId.value, actorId: reportExport.actorId.value, action: `report_exported:${reportExport.reference}` } });
    });
  }
}

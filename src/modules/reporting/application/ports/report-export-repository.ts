import type { ReportExport } from "../../domain/report-export";

export interface ReportExportRepository {
  findByReference(
    organizationId: string,
    reference: string,
  ): Promise<ReportExport | null>;
  save(reportExport: ReportExport): Promise<void>;
}

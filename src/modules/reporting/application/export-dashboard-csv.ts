import type { Clock } from "@/shared/domain/clock";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { dashboardAsCsv } from "../domain/dashboard-csv";
import { DashboardFilter } from "../domain/dashboard-filter";
import { ReportExport } from "../domain/report-export";
import type { ReportExportRepository } from "./ports/report-export-repository";
import { ViewDashboard } from "./view-dashboard";
import { DomainError } from "@/shared/domain/domain-error";

export class ExportDashboardCsv {
  public constructor(
    private readonly dashboard: ViewDashboard,
    private readonly exports: ReportExportRepository,
    private readonly ids: IdentifierGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId?: string | null;
      occurredFrom?: Date | null;
      occurredTo?: Date | null;
      actorId: string | null;
      reference: string;
    }>,
  ): Promise<ReportExport> {
    const filter = DashboardFilter.create(input);
    const reference = input.reference.trim().normalize("NFC");
    const dashboard = await this.dashboard.execute({
      ...input,
      ...filter,
      organizationId: filter.organizationId.value,
      shopId: filter.shopId?.value ?? null,
    });
    const existing = await this.exports.findByReference(
      filter.organizationId.value,
      reference,
    );
    if (existing !== null) {
      if (
        existing.filter.shopId?.value !== filter.shopId?.value ||
        existing.filter.occurredFrom?.getTime() !==
          filter.occurredFrom?.getTime() ||
        existing.filter.occurredTo?.getTime() !== filter.occurredTo?.getTime()
      ) {
        throw new DomainError(
          "reporting.export_reference_taken",
          "The export reference is already used for another dashboard.",
        );
      }
      return existing;
    }
    if (input.actorId === null)
      throw new DomainError(
        "reporting.read_forbidden",
        "An actor is required to export a dashboard.",
      );
    const reportExport = ReportExport.create({
      id: this.ids.next().value,
      filter,
      reference,
      actorId: input.actorId,
      content: dashboardAsCsv(dashboard),
      exportedAt: this.clock.now(),
    });
    await this.exports.save(reportExport);
    return reportExport;
  }
}

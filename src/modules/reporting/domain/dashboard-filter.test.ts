import { describe, expect, it } from "vitest";
import { DashboardFilter } from "./dashboard-filter";
import { ReportExport } from "./report-export";

describe("DashboardFilter", () => {
  it("rejects an inverted date range", () => {
    expect(() => DashboardFilter.create({ organizationId: "org", occurredFrom: new Date("2026-09-03"), occurredTo: new Date("2026-09-02") })).toThrow(expect.objectContaining({ code: "reporting.invalid_date_range" }));
  });

  it("preserves Unicode references in NFC form", () => {
    const reportExport = ReportExport.create({ id: "export", filter: DashboardFilter.create({ organizationId: "org" }), reference: "  Export ɛɔɲŋ  ", actorId: "actor", content: "metric,value", exportedAt: new Date() });
    expect(reportExport.reference).toBe("Export ɛɔɲŋ");
  });
});

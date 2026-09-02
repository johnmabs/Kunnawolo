import { describe, expect, it } from "vitest";
import type { ExpensesReportingSource } from "@/modules/expenses/application/ports/expenses-reporting-source";
import type { InventoryReportingSource } from "@/modules/inventory/application/ports/inventory-reporting-source";
import type { ValuedLossReportingSource } from "@/modules/inventory/application/ports/valued-loss-reporting-source";
import type { SalesReportingSource } from "@/modules/sales/application/ports/sales-reporting-source";
import type { TransfersReportingSource } from "@/modules/transfers/application/ports/transfers-reporting-source";
import { Identifier } from "@/shared/domain/identifier";
import { ExportDashboardCsv } from "./export-dashboard-csv";
import type { ReportExportRepository } from "./ports/report-export-repository";
import type { ReportingReadAuthorization } from "./ports/reporting-read-authorization";
import { ViewDashboard } from "./view-dashboard";

class Sales implements SalesReportingSource { public async listFinalizedSales() { return { currency: "XOF", sales: [{ shopId: "shop", finalizedAt: new Date(), currency: "XOF", revenueMinor: 2000, costMinor: 1000 }] }; } }
class Inventory implements InventoryReportingSource { public async projectStock() { return { onHandQuantity: 10, lossQuantity: 2, anomalyCount: 1 }; } }
class Transfers implements TransfersReportingSource { public async inTransitQuantity() { return 3; } }
class Expenses implements ExpensesReportingSource { public async activeExpenseAmount() { return { currency: "XOF", amountMinor: 300 }; } }
class Losses implements ValuedLossReportingSource { public async valuedLossAmount() { return { currency: "XOF", amountMinor: 200 }; } }
class Authorization implements ReportingReadAuthorization { public calls: Array<readonly [string, string | null, string | null]> = []; public async authorize(organizationId: string, shopId: string | null, actorId: string | null) { this.calls.push([organizationId, shopId, actorId]); } }
class Exports implements ReportExportRepository { public values = new Map<string, import("../domain/report-export").ReportExport>(); public async findByReference(organizationId: string, reference: string) { return this.values.get(`${organizationId}:${reference}`) ?? null; } public async save(reportExport: import("../domain/report-export").ReportExport) { this.values.set(`${reportExport.filter.organizationId.value}:${reportExport.reference}`, reportExport); } }

describe("ExportDashboardCsv", () => {
  it("authorizes and persists an idempotent, explainable CSV snapshot", async () => {
    const authorization = new Authorization();
    const exports = new Exports();
    const view = new ViewDashboard(new Sales(), new Inventory(), new Transfers(), new Expenses(), new Losses(), authorization);
    const useCase = new ExportDashboardCsv(view, exports, { next: () => Identifier.fromString("export-id") }, { now: () => new Date("2026-09-02T12:00:00.000Z") });

    const first = await useCase.execute({ organizationId: "org", shopId: "inactive-shop", actorId: "owner", reference: "  DASH-ɛ  " });
    const second = await useCase.execute({ organizationId: "org", shopId: "inactive-shop", actorId: "owner", reference: "DASH-ɛ" });

    expect(second).toBe(first);
    expect(authorization.calls).toEqual([["org", "inactive-shop", "owner"], ["org", "inactive-shop", "owner"]]);
    expect(first.content).toContain('"estimated_result_minor","500"');
    expect(first.content).toContain('"shop_id","inactive-shop"');
  });
});

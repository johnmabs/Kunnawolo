import { describe, expect, it } from "vitest";
import type { ExpensesReportingSource } from "@/modules/expenses/application/ports/expenses-reporting-source";
import type { ValuedLossReportingSource } from "@/modules/inventory/application/ports/valued-loss-reporting-source";
import type { SalesReportingSource } from "@/modules/sales/application/ports/sales-reporting-source";
import { ProjectEstimatedResult } from "./project-estimated-result";
class Sales implements SalesReportingSource {
  public async listFinalizedSales() {
    return {
      currency: "XOF",
      sales: [
        {
          shopId: "shop",
          finalizedAt: new Date(),
          currency: "XOF",
          revenueMinor: 2000,
          costMinor: 1000,
        },
      ],
    };
  }
}
class Expenses implements ExpensesReportingSource {
  public async activeExpenseAmount() {
    return { currency: "XOF", amountMinor: 300 };
  }
}
class Losses implements ValuedLossReportingSource {
  public async valuedLossAmount() {
    return { currency: "XOF", amountMinor: 200 };
  }
}
describe("ProjectEstimatedResult", () => {
  it("combines explicit reporting sources", async () => {
    await expect(
      new ProjectEstimatedResult(
        new Sales(),
        new Expenses(),
        new Losses(),
      ).execute({ organizationId: "org", shopId: "inactive-shop" }),
    ).resolves.toMatchObject({
      amount: { amountMinor: 500 },
      activeExpenses: { amountMinor: 300 },
      valuedLosses: { amountMinor: 200 },
    });
  });
});

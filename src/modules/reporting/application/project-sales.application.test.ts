import { describe, expect, it } from "vitest";
import type { SalesReportingSource } from "@/modules/sales/application/ports/sales-reporting-source";
import { ProjectSales } from "./project-sales";

class SalesSource implements SalesReportingSource {
  public async listFinalizedSales(
    input: Readonly<{
      organizationId: string;
      shopId: string | null;
      occurredFrom: Date | null;
      occurredTo: Date | null;
    }>,
  ) {
    return {
      currency: "XOF",
      sales:
        input.organizationId === "org"
          ? [
              {
                shopId: input.shopId ?? "shop",
                finalizedAt: new Date(),
                currency: "XOF",
                revenueMinor: 1500,
                costMinor: 900,
              },
            ]
          : [],
    };
  }
}

describe("ProjectSales", () => {
  it("projects an organization or historical shop from the explicit sales source", async () => {
    await expect(
      new ProjectSales(new SalesSource()).execute({
        organizationId: "org",
        shopId: "inactive-shop",
      }),
    ).resolves.toMatchObject({
      shopId: { value: "inactive-shop" },
      revenue: { amountMinor: 1500 },
      costOfGoodsSold: { amountMinor: 900 },
      grossMargin: { amountMinor: 600 },
    });
  });
});

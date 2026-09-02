import { describe, expect, it } from "vitest";
import { SalesProjection } from "./sales-projection";

describe("SalesProjection", () => {
  it("calculates revenue, cost of goods sold, and gross margin from immutable snapshots", () => {
    const projection = SalesProjection.fromSales({ organizationId: "org", shopId: "shop", currency: "XOF", sales: [{ shopId: "shop", finalizedAt: new Date(), currency: "XOF", revenueMinor: 1800, costMinor: 1000 }, { shopId: "shop", finalizedAt: new Date(), currency: "XOF", revenueMinor: 700, costMinor: 400 }] });
    expect(projection).toMatchObject({ organizationId: { value: "org" }, shopId: { value: "shop" }, revenue: { amountMinor: 2500, currency: "XOF" }, costOfGoodsSold: { amountMinor: 1400 }, grossMargin: { amountMinor: 1100 }, saleCount: 2 });
  });

  it("rejects invalid historical sales snapshots", () => {
    expect(() => SalesProjection.fromSales({ organizationId: "org", shopId: null, currency: "XOF", sales: [{ shopId: "shop", finalizedAt: new Date(), currency: "EUR", revenueMinor: 1, costMinor: 0 }] })).toThrow(expect.objectContaining({ code: "reporting.invalid_sales_snapshot" }));
  });
});

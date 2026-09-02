import { describe, expect, it } from "vitest";
import { StockProjection } from "./stock-projection";

describe("StockProjection", () => {
  it("keeps current stock, transit, losses, and anomalies in one scoped projection", () => {
    expect(StockProjection.create({ organizationId: "org", shopId: "shop", onHandQuantity: 12.5, inTransitQuantity: 3, lossQuantity: 1.5, anomalyCount: 2 })).toMatchObject({ organizationId: { value: "org" }, shopId: { value: "shop" }, onHandQuantity: { value: 12.5 }, inTransitQuantity: { value: 3 }, lossQuantity: { value: 1.5 }, anomalyCount: 2 });
  });

  it("rejects invalid anomaly counts", () => {
    expect(() => StockProjection.create({ organizationId: "org", shopId: null, onHandQuantity: 0, inTransitQuantity: 0, lossQuantity: 0, anomalyCount: -1 })).toThrow(expect.objectContaining({ code: "reporting.invalid_stock_anomaly_count" }));
  });
});

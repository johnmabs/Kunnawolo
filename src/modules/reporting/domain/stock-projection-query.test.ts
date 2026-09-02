import { describe, expect, it } from "vitest";
import { StockProjectionQuery } from "./stock-projection-query";

describe("StockProjectionQuery", () => {
  it("accepts an inactive historical shop scope", () => {
    expect(StockProjectionQuery.create({ organizationId: "org", shopId: "inactive-shop" })).toMatchObject({ shopId: { value: "inactive-shop" } });
  });

  it("rejects inverted periods", () => {
    expect(() => StockProjectionQuery.create({ organizationId: "org", occurredFrom: new Date("2026-09-03"), occurredTo: new Date("2026-09-02") })).toThrow(expect.objectContaining({ code: "reporting.invalid_date_range" }));
  });
});

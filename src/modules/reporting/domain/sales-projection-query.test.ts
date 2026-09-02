import { describe, expect, it } from "vitest";
import { SalesProjectionQuery } from "./sales-projection-query";

describe("SalesProjectionQuery", () => {
  it("keeps an optional historical shop scope", () => {
    expect(SalesProjectionQuery.create({ organizationId: "org", shopId: "inactive-shop" })).toMatchObject({ organizationId: { value: "org" }, shopId: { value: "inactive-shop" } });
  });

  it("rejects inverted periods", () => {
    expect(() => SalesProjectionQuery.create({ organizationId: "org", occurredFrom: new Date("2026-09-03"), occurredTo: new Date("2026-09-02") })).toThrow(expect.objectContaining({ code: "reporting.invalid_date_range" }));
  });
});

import { describe, expect, it } from "vitest";
import { OperationalAlertPageQuery } from "./operational-alert-page-query";

describe("OperationalAlertPageQuery", () => {
  it("bounds pagination and round-trips an opaque cursor", () => {
    const cursor = OperationalAlertPageQuery.cursorOf({ id: "alert-ɛ", occurredAt: new Date("2026-09-02T12:00:00.000Z") });
    expect(OperationalAlertPageQuery.create({ organizationId: "org", shopId: "inactive-shop", limit: 2, cursor })).toMatchObject({ limit: 2, cursor: { id: "alert-ɛ" } });
    expect(() => OperationalAlertPageQuery.create({ organizationId: "org", limit: 101 })).toThrow(expect.objectContaining({ code: "observability.invalid_page_limit" }));
  });
});

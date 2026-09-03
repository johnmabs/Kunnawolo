import { describe, expect, it } from "vitest";
import { Money } from "@/shared/domain/money";
import { EstimatedResult } from "./estimated-result";
describe("EstimatedResult", () => {
  it("subtracts active expenses and valued losses from gross margin", () => {
    expect(
      EstimatedResult.create({
        organizationId: "org",
        shopId: "shop",
        grossMargin: Money.fromMinor(1000, "XOF"),
        activeExpenses: Money.fromMinor(250, "XOF"),
        valuedLosses: Money.fromMinor(150, "XOF"),
      }),
    ).toMatchObject({ amount: { amountMinor: 600, currency: "XOF" } });
  });
});

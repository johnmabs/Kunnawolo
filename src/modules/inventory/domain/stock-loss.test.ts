import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";
import { StockLoss } from "./stock-loss";
describe("StockLoss", () => {
  it("snapshots cost and normalizes a Unicode reason", () => {
    expect(
      StockLoss.create({
        id: Identifier.fromString("loss"),
        organizationId: Identifier.fromString("org"),
        shopId: Identifier.fromString("shop"),
        productId: Identifier.fromString("product"),
        quantity: Quantity.fromNumber(1),
        reason: "  Expiration Ɛ  ",
        referenceCost: Money.fromMinor(500, "XOF"),
        actorId: "actor",
        occurredAt: new Date(),
      }),
    ).toMatchObject({
      reason: "Expiration Ɛ",
      referenceCost: { amountMinor: 500 },
    });
  });
});

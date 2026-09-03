import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";
import { SaleCart, SaleLine } from "./sale-cart";
import { SalePayment } from "./sale-payment";
const finalization = () =>
  SaleCart.draft(
    Identifier.fromString("cart"),
    Identifier.fromString("org"),
    Identifier.fromString("shop"),
    [
      SaleLine.create({
        id: Identifier.fromString("line"),
        productId: Identifier.fromString("product"),
        productNameSnapshot: "Nsiirin Ɛ",
        quantity: Quantity.fromNumber(2),
        unitPrice: Money.fromMinor(800, "XOF"),
        unitCost: Money.fromMinor(500, "XOF"),
        discount: Money.fromMinor(100, "XOF"),
      }),
    ],
  ).finalize("Vente Ɛ", "actor", new Date("2026-09-01T12:00:00.000Z"));
describe("SalePayment", () => {
  it("requires the exact finalized snapshot total", () => {
    expect(
      SalePayment.record({
        id: Identifier.fromString("payment"),
        finalization: finalization(),
        paymentReference: "  PAY-Ɛ  ",
        method: "CASH",
        amount: Money.fromMinor(1500, "XOF"),
        actorId: "actor",
        paidAt: new Date(),
      }),
    ).toMatchObject({
      paymentReference: "PAY-Ɛ",
      amount: { amountMinor: 1500 },
    });
    expect(() =>
      SalePayment.record({
        id: Identifier.fromString("payment"),
        finalization: finalization(),
        paymentReference: "PAY",
        method: "CASH",
        amount: Money.fromMinor(1499, "XOF"),
        actorId: "actor",
        paidAt: new Date(),
      }),
    ).toThrowError(
      expect.objectContaining({ code: "sales.invalid_payment_amount" }),
    );
  });
});

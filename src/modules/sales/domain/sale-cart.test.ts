import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";
import { SaleCart, SaleLine } from "./sale-cart";
const line = () => SaleLine.create({ id: Identifier.fromString("line"), productId: Identifier.fromString("product"), productNameSnapshot: "  Nsiirin Ɛ Ɔ ɲ ŋ Fɔ́lɔ  ", quantity: Quantity.fromNumber(2), unitPrice: Money.fromMinor(800, "XOF"), unitCost: Money.fromMinor(500, "XOF"), discount: Money.fromMinor(100, "XOF") });
describe("SaleCart", () => {
  it("keeps immutable Unicode commercial snapshots", () => { expect(line()).toMatchObject({ productNameSnapshot: "Nsiirin Ɛ Ɔ ɲ ŋ Fɔ́lɔ".normalize("NFC"), quantity: { value: 2 }, unitPrice: { amountMinor: 800 }, unitCost: { amountMinor: 500 }, discount: { amountMinor: 100 } }); });
  it("adds and removes lines without changing its scope", () => { const cart = SaleCart.draft(Identifier.fromString("cart"), Identifier.fromString("org"), Identifier.fromString("shop")); expect(cart.addOrReplace(line()).remove(Identifier.fromString("line"))).toMatchObject({ organizationId: { value: "org" }, shopId: { value: "shop" }, lines: [] }); });
  it("rejects excessive discounts", () => { expect(() => SaleLine.create({ id: Identifier.fromString("line"), productId: Identifier.fromString("product"), productNameSnapshot: "Nsiirin", quantity: Quantity.fromNumber(1), unitPrice: Money.fromMinor(800, "XOF"), unitCost: Money.fromMinor(500, "XOF"), discount: Money.fromMinor(801, "XOF") })).toThrowError(expect.objectContaining({ code: "sales.invalid_discount" })); });
});

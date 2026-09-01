import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { ProductPricing } from "./product-pricing";

const valid = () => ({ id: Identifier.fromString("price"), organizationId: Identifier.fromString("org"), productId: Identifier.fromString("product"), referenceCost: Money.fromMinor(500, "XOF"), salePrice: Money.fromMinor(800, "XOF"), reference: "  Tarif Ɛ ɲ ŋ  ", actorId: "actor", createdAt: new Date("2026-09-01T00:00:00.000Z") });

describe("ProductPricing", () => {
  it("keeps integer Money and a normalized Unicode decision reference", () => { expect(ProductPricing.create(valid())).toMatchObject({ reference: "Tarif Ɛ ɲ ŋ", referenceCost: Money.fromMinor(500, "XOF"), salePrice: Money.fromMinor(800, "XOF") }); });
  it("rejects negative costs, non-positive prices and mixed currencies", () => {
    expect(() => ProductPricing.create({ ...valid(), referenceCost: Money.fromMinor(-1, "XOF") })).toThrowError(expect.objectContaining<Partial<DomainError>>({ code: "catalog.invalid_reference_cost" }));
    expect(() => ProductPricing.create({ ...valid(), salePrice: Money.fromMinor(0, "XOF") })).toThrowError(expect.objectContaining<Partial<DomainError>>({ code: "catalog.invalid_sale_price" }));
    expect(() => ProductPricing.create({ ...valid(), salePrice: Money.fromMinor(800, "EUR") })).toThrowError(expect.objectContaining<Partial<DomainError>>({ code: "catalog.price_currency_mismatch" }));
  });
});

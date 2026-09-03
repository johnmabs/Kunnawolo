import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Product } from "./product";

describe("Product", () => {
  it("normalizes NFC without transliterating Unicode catalogue data", () => {
    const product = Product.create(
      Identifier.fromString("product"),
      Identifier.fromString("org"),
      {
        name: "  Nsiirin Ɛ Ɔ ɲ ŋ Fɔ́lɔ  ",
        code: "  KɔD-Ɛ  ",
        barcode: "  123  ",
        packaging: "  Sàc  ",
        form: "  Pɔ́dɔrɔ  ",
      },
    );
    expect(product).toMatchObject({
      name: "Nsiirin Ɛ Ɔ ɲ ŋ Fɔ́lɔ".normalize("NFC"),
      code: "KɔD-Ɛ",
      barcode: "123",
      packaging: "Sàc".normalize("NFC"),
      form: "Pɔ́dɔrɔ".normalize("NFC"),
      isActive: true,
    });
  });

  it("keeps organization identity and status while revising", () => {
    const product = Product.create(
      Identifier.fromString("product"),
      Identifier.fromString("org"),
      { name: "Nsiirin" },
    ).deactivate();
    const revised = product.revise({ name: " Ɛ ɲ ŋ " });
    expect(revised).toMatchObject({
      organizationId: Identifier.fromString("org"),
      name: "Ɛ ɲ ŋ",
      isActive: false,
    });
  });

  it("rejects an empty name", () => {
    expect(() =>
      Product.create(
        Identifier.fromString("product"),
        Identifier.fromString("org"),
        { name: "  " },
      ),
    ).toThrowError(
      expect.objectContaining<Partial<DomainError>>({
        code: "catalog.invalid_product_name",
      }),
    );
  });
});

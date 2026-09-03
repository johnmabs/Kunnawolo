import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { CreateSaleCart } from "./create-sale-cart";
import { GetSaleCart } from "./get-sale-cart";
import type {
  SaleAudit,
  SaleCartRepository,
} from "./ports/sale-cart-repository";
import type { SalesScope } from "./ports/sales-scope";
import { RemoveSaleLine } from "./remove-sale-line";
import { SaveSaleLine } from "./save-sale-line";
import type { SaleCart, SaleLine } from "../domain/sale-cart";

class Carts implements SaleCartRepository {
  public cart: SaleCart | null = null;
  public readonly audits: SaleAudit[] = [];
  public async create(cart: SaleCart, audit: SaleAudit): Promise<void> {
    this.cart = cart;
    this.audits.push(audit);
  }
  public async find(
    organizationId: string,
    cartId: string,
  ): Promise<SaleCart | null> {
    return this.cart?.organizationId.value === organizationId &&
      this.cart.id.value === cartId
      ? this.cart
      : null;
  }
  public async saveLine(
    _organizationId: string,
    _cartId: string,
    line: SaleLine,
    audit: SaleAudit,
  ): Promise<void> {
    this.cart = this.cart?.addOrReplace(line) ?? null;
    this.audits.push(audit);
  }
  public async removeLine(
    _organizationId: string,
    _cartId: string,
    lineId: string,
    audit: SaleAudit,
  ): Promise<void> {
    this.cart = this.cart?.remove(Identifier.fromString(lineId)) ?? null;
    this.audits.push(audit);
  }
}
const scope: SalesScope = {
  activeShopBelongsToOrganization: async (organizationId) =>
    organizationId === "org",
  findActiveProductSnapshot: async (organizationId) =>
    organizationId === "org"
      ? {
          name: "Nsiirin Ɛ Ɔ ɲ ŋ",
          unitPriceMinor: 800,
          unitCostMinor: 500,
          currency: "XOF",
        }
      : null,
};

describe("sale cart use cases", () => {
  it("creates, reads, updates and removes snapshot lines in one organization", async () => {
    const carts = new Carts();
    let next = 0;
    const ids = { next: () => Identifier.fromString(`id-${++next}`) };
    const cart = await new CreateSaleCart(scope, carts, ids).execute({
      organizationId: "org",
      shopId: "shop",
      actorId: "actor",
    });
    const save = new SaveSaleLine(scope, carts, ids);
    const line = await save.execute({
      organizationId: "org",
      cartId: cart.id.value,
      productId: "product",
      quantity: 2,
      discountMinor: 100,
      actorId: "actor",
    });
    await save.execute({
      organizationId: "org",
      cartId: cart.id.value,
      lineId: line.id.value,
      productId: "product",
      quantity: 3,
      discountMinor: 0,
      actorId: "actor",
    });
    await expect(
      new GetSaleCart(carts).execute({
        organizationId: "org",
        cartId: cart.id.value,
      }),
    ).resolves.toMatchObject({
      lines: [
        { productNameSnapshot: "Nsiirin Ɛ Ɔ ɲ ŋ", quantity: { value: 3 } },
      ],
    });
    await new RemoveSaleLine(carts).execute({
      organizationId: "org",
      cartId: cart.id.value,
      lineId: line.id.value,
      actorId: "actor",
    });
    expect(carts.cart?.lines).toEqual([]);
    await expect(
      new GetSaleCart(carts).execute({
        organizationId: "other",
        cartId: cart.id.value,
      }),
    ).rejects.toMatchObject({ code: "sales.cart_not_found" });
  });
});

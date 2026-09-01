import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { SaleLine } from "../domain/sale-cart";
import { GetSaleCart } from "./get-sale-cart";
import type { SaleCartRepository } from "./ports/sale-cart-repository";
import type { SalesScope } from "./ports/sales-scope";

export class SaveSaleLine {
  public constructor(private readonly scope: SalesScope, private readonly carts: SaleCartRepository, private readonly ids: IdentifierGenerator) {}

  public async execute(input: Readonly<{ organizationId: string; cartId: string; lineId?: string; productId: string; quantity: number; discountMinor: number; actorId: string | null }>): Promise<SaleLine> {
    const cart = await new GetSaleCart(this.carts).execute(input);
    if (input.lineId !== undefined && !cart.lines.some(({ id }) => id.value === input.lineId)) throw new DomainError("sales.line_not_found", "The line does not belong to this draft cart.");
    const snapshot = await this.scope.findActiveProductSnapshot(input.organizationId, input.productId);
    if (snapshot === null) throw new DomainError("sales.product_not_found", "The active priced product does not belong to this organization.");
    const line = SaleLine.create({
      id: input.lineId === undefined ? this.ids.next() : Identifier.fromString(input.lineId),
      productId: Identifier.fromString(input.productId),
      productNameSnapshot: snapshot.name,
      quantity: Quantity.fromNumber(input.quantity),
      unitPrice: Money.fromMinor(snapshot.unitPriceMinor, snapshot.currency),
      unitCost: Money.fromMinor(snapshot.unitCostMinor, snapshot.currency),
      discount: Money.fromMinor(input.discountMinor, snapshot.currency),
    });
    await this.carts.saveLine(input.organizationId, input.cartId, line, { organizationId: input.organizationId, actorId: input.actorId, action: input.lineId === undefined ? "sale_line.added" : "sale_line.updated" });
    return line;
  }
}

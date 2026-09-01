import { Identifier } from "@/shared/domain/identifier";
import { GetSaleCart } from "./get-sale-cart";
import type { SaleCartRepository } from "./ports/sale-cart-repository";
export class RemoveSaleLine { public constructor(private readonly carts: SaleCartRepository) {} public async execute(input: Readonly<{ organizationId: string; cartId: string; lineId: string; actorId: string | null }>): Promise<void> { await new GetSaleCart(this.carts).execute(input); Identifier.fromString(input.lineId); await this.carts.removeLine(input.organizationId, input.cartId, input.lineId, { organizationId: input.organizationId, actorId: input.actorId, action: "sale_line.removed" }); } }

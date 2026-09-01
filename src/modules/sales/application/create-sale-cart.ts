import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { SaleCart } from "../domain/sale-cart";
import type { SaleCartRepository } from "./ports/sale-cart-repository";
import type { SalesScope } from "./ports/sales-scope";
export class CreateSaleCart { public constructor(private readonly scope: SalesScope, private readonly carts: SaleCartRepository, private readonly ids: IdentifierGenerator) {} public async execute(input: Readonly<{ organizationId: string; shopId: string; actorId: string | null }>): Promise<SaleCart> { if (!(await this.scope.activeShopBelongsToOrganization(input.organizationId, input.shopId))) throw new DomainError("sales.shop_not_found", "The active shop does not belong to this organization."); const cart = SaleCart.draft(this.ids.next(), Identifier.fromString(input.organizationId), Identifier.fromString(input.shopId)); await this.carts.create(cart, { organizationId: input.organizationId, actorId: input.actorId, action: "sale_cart.created" }); return cart; } }

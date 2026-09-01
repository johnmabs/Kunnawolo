import type { SaleCart, SaleLine } from "../../domain/sale-cart";
export interface SaleCartRepository { save(cart: SaleCart, actorId: string | null): Promise<void>; find(organizationId: string, id: string): Promise<SaleCart | null>; addLine(cartId: string, line: SaleLine, actorId: string | null): Promise<void>; }

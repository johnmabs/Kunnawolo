import type { SaleFinalization } from "../../domain/sale-cart";
export interface SaleFinalizationRepository {
  findByReference(
    organizationId: string,
    reference: string,
  ): Promise<SaleFinalization | null>;
  findByCartId(
    organizationId: string,
    cartId: string,
  ): Promise<SaleFinalization | null>;
  commit(finalization: SaleFinalization): Promise<void>;
}

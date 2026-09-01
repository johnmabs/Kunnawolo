import { DomainError } from "@/shared/domain/domain-error";
import type { Clock } from "@/shared/domain/clock";
import { GetSaleCart } from "./get-sale-cart";
import type { SaleCartRepository } from "./ports/sale-cart-repository";
import type { SaleFinalizationRepository } from "./ports/sale-finalization-repository";
export class FinalizeSaleCart {
  public constructor(private readonly carts: SaleCartRepository, private readonly finalizations: SaleFinalizationRepository, private readonly clock: Clock) {}
  public async execute(input: Readonly<{ organizationId: string; cartId: string; reference: string; actorId: string | null }>) {
    const reference = input.reference.trim().normalize("NFC");
    const existing = await this.finalizations.findByReference(input.organizationId, reference);
    if (existing !== null) { if (existing.cartId.value !== input.cartId) throw new DomainError("sales.finalization_reference_taken", "The finalization reference is already used."); return existing; }
    const cart = await new GetSaleCart(this.carts).execute(input);
    const finalization = cart.finalize(reference, input.actorId, this.clock.now());
    await this.finalizations.commit(finalization);
    return finalization;
  }
}

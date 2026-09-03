import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { Clock } from "@/shared/domain/clock";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { SaleCancellation } from "../domain/sale-cancellation";
import type { SaleCancellationRepository } from "./ports/sale-cancellation-repository";
import type { SalesCancellationAuthorization } from "./ports/sales-cancellation-authorization";
import type { SaleFinalizationRepository } from "./ports/sale-finalization-repository";
export class CancelSale {
  public constructor(
    private readonly finalizations: SaleFinalizationRepository,
    private readonly cancellations: SaleCancellationRepository,
    private readonly authorization: SalesCancellationAuthorization,
    private readonly ids: IdentifierGenerator,
    private readonly clock: Clock,
  ) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      cartId: string;
      reference: string;
      reason: string;
      actorId: string | null;
    }>,
  ): Promise<SaleCancellation> {
    const reference = input.reference.trim().normalize("NFC");
    const existing = await this.cancellations.findByReference(
      input.organizationId,
      reference,
    );
    if (existing !== null) {
      if (existing.cartId.value !== input.cartId)
        throw new DomainError(
          "sales.cancellation_reference_taken",
          "The cancellation reference is already used.",
        );
      return existing;
    }
    const sale = await this.finalizations.findByCartId(
      input.organizationId,
      input.cartId,
    );
    if (sale === null)
      throw new DomainError(
        "sales.sale_not_finalized",
        "The sale cannot be cancelled in this organization.",
      );
    await this.authorization.authorize(
      input.organizationId,
      sale.shopId.value,
      input.actorId,
    );
    const cancellation = SaleCancellation.create({
      id: this.ids.next(),
      organizationId: Identifier.fromString(input.organizationId),
      cartId: Identifier.fromString(input.cartId),
      reference,
      reason: input.reason,
      actorId: input.actorId,
      cancelledAt: this.clock.now(),
    });
    await this.cancellations.commit(cancellation);
    return cancellation;
  }
}

import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
export class SaleCancellation {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly cartId: Identifier,
    public readonly reference: string,
    public readonly reason: string,
    public readonly actorId: string | null,
    public readonly cancelledAt: Date,
  ) {}
  public static create(
    input: Readonly<{
      id: Identifier;
      organizationId: Identifier;
      cartId: Identifier;
      reference: string;
      reason: string;
      actorId: string | null;
      cancelledAt: Date;
    }>,
  ) {
    const reference = input.reference.trim().normalize("NFC");
    const reason = input.reason.trim().normalize("NFC");
    if (reference.length === 0)
      throw new DomainError(
        "sales.invalid_cancellation_reference",
        "A cancellation reference must be non-empty.",
      );
    if (reason.length === 0)
      throw new DomainError(
        "sales.invalid_cancellation_reason",
        "A cancellation reason must be non-empty.",
      );
    return new SaleCancellation(
      input.id,
      input.organizationId,
      input.cartId,
      reference,
      reason,
      input.actorId,
      input.cancelledAt,
    );
  }
}

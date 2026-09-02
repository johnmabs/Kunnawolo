import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";

export class StockTransferLine {
  private constructor(
    public readonly id: Identifier,
    public readonly productId: Identifier,
    public readonly quantity: Quantity,
  ) {}

  public static create(input: Readonly<{ id: Identifier; productId: Identifier; quantity: Quantity }>): StockTransferLine {
    if (!input.quantity.isPositive()) {
      throw new DomainError("transfers.invalid_line_quantity", "A transfer line quantity must be strictly positive.");
    }
    return new StockTransferLine(input.id, input.productId, input.quantity);
  }
}

export class StockTransfer {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly sourceShopId: Identifier,
    public readonly destinationShopId: Identifier,
    public readonly lines: readonly StockTransferLine[],
  ) {}

  public static draft(input: Readonly<{ id: Identifier; organizationId: Identifier; sourceShopId: Identifier; destinationShopId: Identifier; lines?: readonly StockTransferLine[] }>): StockTransfer {
    if (input.sourceShopId.equals(input.destinationShopId)) {
      throw new DomainError("transfers.same_source_and_destination", "The source and destination shops must differ.");
    }
    return new StockTransfer(input.id, input.organizationId, input.sourceShopId, input.destinationShopId, input.lines ?? []);
  }

  public addOrReplace(line: StockTransferLine): StockTransfer {
    return StockTransfer.draft({
      id: this.id,
      organizationId: this.organizationId,
      sourceShopId: this.sourceShopId,
      destinationShopId: this.destinationShopId,
      lines: [...this.lines.filter(({ productId }) => !productId.equals(line.productId)), line],
    });
  }
}

export class StockTransferShipment {
  private constructor(
    public readonly transferId: Identifier,
    public readonly organizationId: Identifier,
    public readonly sourceShopId: Identifier,
    public readonly destinationShopId: Identifier,
    public readonly lines: readonly StockTransferLine[],
    public readonly reference: string,
    public readonly actorId: string | null,
    public readonly sentAt: Date,
  ) {}

  public static create(transfer: StockTransfer, reference: string, actorId: string | null, sentAt: Date): StockTransferShipment {
    if (transfer.lines.length === 0) throw new DomainError("transfers.empty_transfer", "An empty transfer cannot be sent.");
    const normalizedReference = reference.trim().normalize("NFC");
    if (normalizedReference.length === 0) throw new DomainError("transfers.invalid_shipment_reference", "A shipment reference must be non-empty.");
    return new StockTransferShipment(transfer.id, transfer.organizationId, transfer.sourceShopId, transfer.destinationShopId, transfer.lines, normalizedReference, actorId, sentAt);
  }
}

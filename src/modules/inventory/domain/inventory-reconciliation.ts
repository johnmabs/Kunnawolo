import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class InventoryReconciliation {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier,
    public readonly reference: string,
    public readonly actorId: string | null,
    public readonly reconciledAt: Date,
    public readonly lines: readonly InventoryReconciliationLine[],
  ) {}

  public static detect(
    input: Readonly<{
      id: Identifier;
      organizationId: Identifier;
      shopId: Identifier;
      reference: string;
      actorId: string | null;
      reconciledAt: Date;
      snapshots: readonly InventoryReconciliationSnapshot[];
      lineIds: readonly Identifier[];
    }>,
  ): InventoryReconciliation {
    const reference = input.reference.trim().normalize("NFC");
    if (reference.length === 0)
      throw new DomainError(
        "inventory.invalid_reconciliation_reference",
        "A reconciliation reference must be non-empty.",
      );
    const divergences = input.snapshots.filter(
      (snapshot) => snapshot.stockLevelQuantity !== snapshot.ledgerQuantity,
    );
    if (divergences.length !== input.lineIds.length)
      throw new DomainError(
        "inventory.invalid_reconciliation_lines",
        "Every divergence must have one reconciliation line.",
      );
    return new InventoryReconciliation(
      input.id,
      input.organizationId,
      input.shopId,
      reference,
      input.actorId,
      input.reconciledAt,
      divergences.map((snapshot, index) =>
        InventoryReconciliationLine.create(input.lineIds[index], snapshot),
      ),
    );
  }
}

export type InventoryReconciliationSnapshot = Readonly<{
  productId: Identifier;
  stockLevelId: Identifier;
  stockLevelQuantity: number;
  ledgerQuantity: number;
}>;

export class InventoryReconciliationLine {
  private constructor(
    public readonly id: Identifier,
    public readonly productId: Identifier,
    public readonly stockLevelId: Identifier,
    public readonly stockLevelQuantity: number,
    public readonly ledgerQuantity: number,
    public readonly quantityDifference: number,
  ) {}
  public static create(
    id: Identifier,
    snapshot: InventoryReconciliationSnapshot,
  ): InventoryReconciliationLine {
    if (
      !Number.isFinite(snapshot.stockLevelQuantity) ||
      !Number.isFinite(snapshot.ledgerQuantity)
    )
      throw new DomainError(
        "inventory.invalid_reconciliation_quantity",
        "Reconciliation quantities must be finite.",
      );
    const quantityDifference =
      snapshot.stockLevelQuantity - snapshot.ledgerQuantity;
    if (quantityDifference === 0)
      throw new DomainError(
        "inventory.invalid_reconciliation_line",
        "A reconciliation line must represent a divergence.",
      );
    return new InventoryReconciliationLine(
      id,
      snapshot.productId,
      snapshot.stockLevelId,
      snapshot.stockLevelQuantity,
      snapshot.ledgerQuantity,
      quantityDifference,
    );
  }
}

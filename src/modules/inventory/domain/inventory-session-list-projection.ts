import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export type InventorySessionListItem = Readonly<{
  sessionId: string;
  status: string;
  openedAt: Date;
  closedAt: Date | null;
  totalLineCount: number;
  countedLineCount: number;
  progressPercentage: number;
  discrepancyLineCount: number;
  discrepancyQuantity: number;
}>;

export class InventorySessionListProjection {
  private constructor(
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier,
    public readonly shopName: string,
    public readonly items: readonly InventorySessionListItem[],
  ) {}

  public static create(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      shopName: string;
      items: readonly Omit<InventorySessionListItem, "progressPercentage">[];
    }>,
  ): InventorySessionListProjection {
    const items = input.items.map((item) => {
      if (
        item.totalLineCount < 0 ||
        item.countedLineCount < 0 ||
        item.countedLineCount > item.totalLineCount ||
        item.discrepancyLineCount < 0 ||
        item.discrepancyQuantity < 0
      ) {
        throw new DomainError(
          "inventory.invalid_session_projection",
          "Inventory session progress and discrepancies are inconsistent.",
        );
      }
      return {
        ...item,
        progressPercentage:
          item.totalLineCount === 0
            ? 100
            : Math.round((item.countedLineCount / item.totalLineCount) * 100),
      };
    });
    return new InventorySessionListProjection(
      Identifier.fromString(input.organizationId),
      Identifier.fromString(input.shopId),
      input.shopName.trim().normalize("NFC"),
      items,
    );
  }
}

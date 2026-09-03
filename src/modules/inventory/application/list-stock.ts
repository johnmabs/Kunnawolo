import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { StockListProjection } from "../domain/stock-list-projection";
import type { InventoryProjectionRepository } from "./ports/inventory-projection-repository";

export class ListStock {
  public constructor(
    private readonly projections: InventoryProjectionRepository,
  ) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      productSearch?: string | null;
    }>,
  ): Promise<StockListProjection> {
    const organizationId = Identifier.fromString(input.organizationId).value;
    const shopId = Identifier.fromString(input.shopId).value;
    const productSearch = input.productSearch?.trim().normalize("NFC") || null;
    const projection = await this.projections.listStock(
      organizationId,
      shopId,
      productSearch,
    );
    if (projection === null)
      throw new DomainError(
        "inventory.shop_not_found",
        "The shop does not belong to this organization.",
      );
    return projection;
  }
}

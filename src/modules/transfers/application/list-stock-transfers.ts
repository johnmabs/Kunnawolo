import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { StockTransferListProjection } from "../domain/stock-transfer-list-projection";
import type { StockTransferProjectionRepository } from "./ports/stock-transfer-projection-repository";

export class ListStockTransfers {
  public constructor(
    private readonly projections: StockTransferProjectionRepository,
  ) {}
  public async execute(
    input: Readonly<{ organizationId: string; shopId?: string | null }>,
  ): Promise<StockTransferListProjection> {
    const organizationId = Identifier.fromString(input.organizationId).value;
    const shopId =
      input.shopId === null || input.shopId === undefined
        ? null
        : Identifier.fromString(input.shopId).value;
    const projection = await this.projections.list(organizationId, shopId);
    if (projection === null)
      throw new DomainError(
        "transfers.shop_not_found",
        "The shop does not belong to this organization.",
      );
    return projection;
  }
}

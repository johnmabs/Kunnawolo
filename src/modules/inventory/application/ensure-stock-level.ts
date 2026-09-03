import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { StockLevel } from "../domain/stock-level";
import type { InventoryScope } from "./ports/inventory-scope";
import type { StockLevelRepository } from "./ports/stock-level-repository";

export class EnsureStockLevel {
  public constructor(
    private readonly scope: InventoryScope,
    private readonly levels: StockLevelRepository,
    private readonly ids: IdentifierGenerator,
  ) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      productId: string;
      actorId: string | null;
    }>,
  ): Promise<StockLevel> {
    if (
      !(await this.scope.shopBelongsToOrganization(
        input.organizationId,
        input.shopId,
      ))
    )
      throw new DomainError(
        "inventory.shop_not_found",
        "The shop does not belong to this organization.",
      );
    if (
      !(await this.scope.productTracksInventory(
        input.organizationId,
        input.productId,
      ))
    )
      throw new DomainError(
        "inventory.product_not_tracked",
        "The product does not track inventory in this organization.",
      );
    return this.levels.ensure(
      StockLevel.initialize(
        this.ids.next(),
        Identifier.fromString(input.organizationId),
        Identifier.fromString(input.shopId),
        Identifier.fromString(input.productId),
      ),
      {
        organizationId: input.organizationId,
        actorId: input.actorId,
        action: "stock_level.initialized",
      },
    );
  }
}

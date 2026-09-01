import { DomainError } from "@/shared/domain/domain-error";
import type { StockLevelRepository } from "./ports/stock-level-repository";
import type { StockLevel } from "../domain/stock-level";

export class GetStockLevel {
  public constructor(private readonly levels: StockLevelRepository) {}
  public async execute(input: Readonly<{ organizationId: string; shopId: string; productId: string }>): Promise<StockLevel> {
    const level = await this.levels.find(input.organizationId, input.shopId, input.productId);
    if (level === null) throw new DomainError("inventory.stock_level_not_found", "No stock level exists for this shop and product.");
    return level;
  }
}

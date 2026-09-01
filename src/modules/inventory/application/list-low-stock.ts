import type { StockLevelRepository } from "./ports/stock-level-repository";
import type { StockLevel } from "../domain/stock-level";
export class ListLowStock { public constructor(private readonly levels: StockLevelRepository) {} public execute(input: Readonly<{ organizationId: string; shopId: string }>): Promise<StockLevel[]> { return this.levels.findLowStock(input.organizationId, input.shopId); } }

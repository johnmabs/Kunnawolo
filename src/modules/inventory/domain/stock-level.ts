import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";

export class StockLevel {
  private constructor(public readonly id: Identifier, public readonly organizationId: Identifier, public readonly shopId: Identifier, public readonly productId: Identifier, public readonly quantity: Quantity, public readonly lowStockThreshold: Quantity) {}
  public static initialize(id: Identifier, organizationId: Identifier, shopId: Identifier, productId: Identifier): StockLevel { return new StockLevel(id, organizationId, shopId, productId, Quantity.zero(), Quantity.zero()); }
  public static reconstitute(id: Identifier, organizationId: Identifier, shopId: Identifier, productId: Identifier, quantity: Quantity, lowStockThreshold: Quantity = Quantity.zero()): StockLevel { return new StockLevel(id, organizationId, shopId, productId, quantity, lowStockThreshold); }
  public withLowStockThreshold(lowStockThreshold: Quantity): StockLevel { return new StockLevel(this.id, this.organizationId, this.shopId, this.productId, this.quantity, lowStockThreshold); }
  public isLowStock(): boolean { return this.lowStockThreshold.isPositive() && this.quantity.value <= this.lowStockThreshold.value; }
}

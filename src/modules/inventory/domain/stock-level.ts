import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";

export class StockLevel {
  private constructor(public readonly id: Identifier, public readonly organizationId: Identifier, public readonly shopId: Identifier, public readonly productId: Identifier, public readonly quantity: Quantity) {}
  public static initialize(id: Identifier, organizationId: Identifier, shopId: Identifier, productId: Identifier): StockLevel { return new StockLevel(id, organizationId, shopId, productId, Quantity.zero()); }
  public static reconstitute(id: Identifier, organizationId: Identifier, shopId: Identifier, productId: Identifier, quantity: Quantity): StockLevel { return new StockLevel(id, organizationId, shopId, productId, quantity); }
}

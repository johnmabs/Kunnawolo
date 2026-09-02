import { describe, expect, it } from "vitest";
import { InventorySessionListProjection } from "./inventory-session-list-projection";
import { StockListProjection } from "./stock-list-projection";
import { StockLossHistoryProjection } from "./stock-loss-history-projection";

describe("inventory list projections", () => {
  it("computes low stock, inventory progress and loss value", () => {
    const stock = StockListProjection.create({ organizationId: "org", shopId: "shop", shopName: " Boutique Ɛ ", items: [{ stockLevelId: "level", productId: "product", productName: "Produit", productCode: "P", barcode: null, quantity: 2, lowStockThreshold: 3 }] });
    expect(stock).toMatchObject({ shopName: "Boutique Ɛ", items: [{ isLowStock: true }] });

    const sessions = InventorySessionListProjection.create({ organizationId: "org", shopId: "shop", shopName: "Boutique", items: [{ sessionId: "session", status: "OPEN", openedAt: new Date(), closedAt: null, totalLineCount: 4, countedLineCount: 3, discrepancyLineCount: 1, discrepancyQuantity: 2 }] });
    expect(sessions.items[0]?.progressPercentage).toBe(75);

    const losses = StockLossHistoryProjection.create({ organizationId: "org", shopId: "shop", productId: "product", items: [{ lossId: "loss", productId: "product", productName: "Café Ɛ", productCode: "CAF", quantity: 2.5, reason: "Casse", referenceCostMinor: 200, currency: "XOF", actorId: "actor", occurredAt: new Date() }] });
    expect(losses.items[0]?.totalCostMinor).toBe(500);
  });
});

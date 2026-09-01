import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { EnsureStockLevel } from "./ensure-stock-level";
import type { InventoryScope } from "./ports/inventory-scope";
import type { StockLevelRepository } from "./ports/stock-level-repository";
import { StockLevel } from "../domain/stock-level";

class Scope implements InventoryScope { public async shopBelongsToOrganization(organizationId: string): Promise<boolean> { return organizationId === "org"; } public async productTracksInventory(organizationId: string): Promise<boolean> { return organizationId === "org"; } }
class Levels implements StockLevelRepository { public saved: StockLevel | null = null; public async ensure(level: StockLevel): Promise<StockLevel> { this.saved ??= level; return this.saved; } public async find(): Promise<StockLevel | null> { return this.saved; } public async setLowStockThreshold(level: StockLevel): Promise<StockLevel> { this.saved = level; return level; } public async findLowStock(): Promise<StockLevel[]> { return this.saved?.isLowStock() ? [this.saved] : []; } }
describe("EnsureStockLevel", () => { it("initializes one zero level in the organization scope", async () => { const levels = new Levels(); const useCase = new EnsureStockLevel(new Scope(), levels, { next: () => Identifier.fromString("level") }); await expect(useCase.execute({ organizationId: "org", shopId: "shop", productId: "product", actorId: "actor" })).resolves.toMatchObject({ quantity: { value: 0 }, organizationId: { value: "org" } }); await expect(useCase.execute({ organizationId: "other", shopId: "shop", productId: "product", actorId: "actor" })).rejects.toMatchObject({ code: "inventory.shop_not_found" }); }); });

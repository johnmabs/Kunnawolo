import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { StockLevel } from "./stock-level";
describe("StockLevel", () => { it("starts at a non-negative zero quantity and keeps its scope", () => { expect(StockLevel.initialize(Identifier.fromString("level"), Identifier.fromString("org"), Identifier.fromString("shop"), Identifier.fromString("product"))).toMatchObject({ organizationId: { value: "org" }, shopId: { value: "shop" }, productId: { value: "product" }, quantity: { value: 0 } }); }); });

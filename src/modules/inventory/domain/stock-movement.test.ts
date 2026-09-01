import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { StockMovement } from "./stock-movement";
describe("StockMovement", () => { it("keeps an immutable Unicode reason and signed variation", () => { expect(StockMovement.create({ id: Identifier.fromString("m"), organizationId: Identifier.fromString("o"), shopId: Identifier.fromString("s"), productId: Identifier.fromString("p"), quantityDelta: 2, reason: "  Entrée Ɛ ɲ ŋ  ", actorId: "a", occurredAt: new Date() })).toMatchObject({ quantityDelta: 2, reason: "Entrée Ɛ ɲ ŋ" }); }); });

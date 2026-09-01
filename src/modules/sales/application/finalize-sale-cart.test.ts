import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";
import { SaleCart, SaleLine, type SaleFinalization } from "../domain/sale-cart";
import { FinalizeSaleCart } from "./finalize-sale-cart";
import type { SaleAudit, SaleCartRepository } from "./ports/sale-cart-repository";
import type { SaleFinalizationRepository } from "./ports/sale-finalization-repository";

const line = SaleLine.create({ id: Identifier.fromString("line"), productId: Identifier.fromString("product"), productNameSnapshot: "Nsiirin Ɛ", quantity: Quantity.fromNumber(2), unitPrice: Money.fromMinor(800, "XOF"), unitCost: Money.fromMinor(500, "XOF"), discount: Money.fromMinor(0, "XOF") });
class Carts implements SaleCartRepository { public readonly cart = SaleCart.draft(Identifier.fromString("cart"), Identifier.fromString("org"), Identifier.fromString("shop"), [line]); public async create(): Promise<void> {} public async find(org: string, id: string) { return org === "org" && id === "cart" ? this.cart : null; } public async saveLine(_org: string, _cart: string, _line: SaleLine, _audit: SaleAudit): Promise<void> {} public async removeLine(): Promise<void> {} }
class Finalizations implements SaleFinalizationRepository { public saved: SaleFinalization | null = null; public async findByReference(org: string, reference: string) { return this.saved?.organizationId.value === org && this.saved.reference === reference ? this.saved : null; } public async commit(value: SaleFinalization) { this.saved = value; } }
describe("FinalizeSaleCart", () => { it("finalizes once and returns the same decision on retry", async () => { const finalizations = new Finalizations(); const useCase = new FinalizeSaleCart(new Carts(), finalizations, { now: () => new Date("2026-09-01T12:00:00.000Z") }); const first = await useCase.execute({ organizationId: "org", cartId: "cart", reference: " Vente Ɛ ", actorId: "actor" }); const retry = await useCase.execute({ organizationId: "org", cartId: "cart", reference: "Vente Ɛ", actorId: "actor" }); expect(retry).toBe(first); expect(first).toMatchObject({ reference: "Vente Ɛ", lines: [{ quantity: { value: 2 } }] }); }); });

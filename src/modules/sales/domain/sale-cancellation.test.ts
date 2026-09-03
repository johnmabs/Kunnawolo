import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { SaleCancellation } from "./sale-cancellation";
describe("SaleCancellation", () => {
  it("keeps normalized Unicode reason and reference", () => {
    expect(
      SaleCancellation.create({
        id: Identifier.fromString("cancel"),
        organizationId: Identifier.fromString("org"),
        cartId: Identifier.fromString("cart"),
        reference: "  ANN-Ɛ  ",
        reason: "  Client ɲa  ",
        actorId: "manager",
        cancelledAt: new Date(),
      }),
    ).toMatchObject({ reference: "ANN-Ɛ", reason: "Client ɲa" });
  });
});

import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { ExpenseCancellation } from "./expense-cancellation";

describe("ExpenseCancellation", () => {
  it("keeps a Unicode motive and immutable expense identity", () => {
    const cancellation = ExpenseCancellation.create({ id: Identifier.fromString("cancellation"), organizationId: Identifier.fromString("org"), expenseId: Identifier.fromString("expense"), reference: "  ANN-Ɛ-001  ", reason: "  Saisie ɲa erronée  ", actorId: "actor", cancelledAt: new Date("2026-09-02T11:00:00.000Z") });
    expect(cancellation).toMatchObject({ expenseId: { value: "expense" }, reference: "ANN-Ɛ-001", reason: "Saisie ɲa erronée" });
  });

  it("requires a cancellation reference and motive", () => {
    const input = { id: Identifier.fromString("cancellation"), organizationId: Identifier.fromString("org"), expenseId: Identifier.fromString("expense"), reference: "ANN", reason: "Erreur", actorId: null, cancelledAt: new Date() };
    expect(() => ExpenseCancellation.create({ ...input, reference: " " })).toThrow(expect.objectContaining({ code: "expenses.invalid_cancellation_reference" }));
    expect(() => ExpenseCancellation.create({ ...input, reason: " " })).toThrow(expect.objectContaining({ code: "expenses.invalid_cancellation_reason" }));
  });
});

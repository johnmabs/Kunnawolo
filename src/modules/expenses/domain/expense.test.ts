import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Expense } from "./expense";

describe("Expense", () => {
  it("records a Unicode shop expense without altering its business text", () => {
    const expense = Expense.record({
      id: Identifier.fromString("expense"),
      organizationId: Identifier.fromString("org"),
      categoryId: Identifier.fromString("category"),
      shopId: Identifier.fromString("shop"),
      amount: Money.fromMinor(1500, "XOF"),
      reference: "  DEP-Ɛ-001  ",
      description: "  Lɔgɛlɛn Fɔ́lɔ  ",
      actorId: "actor",
      occurredAt: new Date("2026-09-02T10:00:00.000Z"),
    });
    expect(expense).toMatchObject({
      reference: "DEP-Ɛ-001",
      description: "Lɔgɛlɛn Fɔ́lɔ".normalize("NFC"),
      amount: { amountMinor: 1500, currency: "XOF" },
    });
  });

  it("rejects non-positive amounts and empty traceability fields", () => {
    const input = {
      id: Identifier.fromString("expense"),
      organizationId: Identifier.fromString("org"),
      categoryId: Identifier.fromString("category"),
      shopId: null,
      amount: Money.fromMinor(0, "XOF"),
      reference: "DEP",
      description: "Loyer",
      actorId: null,
      occurredAt: new Date(),
    };
    expect(() => Expense.record(input)).toThrow(
      expect.objectContaining({ code: "expenses.invalid_amount" }),
    );
    expect(() =>
      Expense.record({
        ...input,
        amount: Money.fromMinor(1, "XOF"),
        reference: " ",
      }),
    ).toThrow(expect.objectContaining({ code: "expenses.invalid_reference" }));
    expect(() =>
      Expense.record({
        ...input,
        amount: Money.fromMinor(1, "XOF"),
        description: " ",
      }),
    ).toThrow(
      expect.objectContaining({ code: "expenses.invalid_description" }),
    );
  });
});

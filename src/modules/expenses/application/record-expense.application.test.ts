import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import type { ExpenseRepository } from "./ports/expense-repository";
import { RecordExpense } from "./record-expense";
import type { Expense } from "../domain/expense";

class MemoryExpenses implements ExpenseRepository {
  private readonly values = new Map<string, Expense>();
  public async findByReference(
    organizationId: string,
    reference: string,
  ): Promise<Expense | null> {
    return this.values.get(`${organizationId}:${reference}`) ?? null;
  }
  public async record(expense: Expense): Promise<Expense> {
    const key = `${expense.organizationId.value}:${expense.reference}`;
    const existing = this.values.get(key);
    if (existing !== undefined) return existing;
    this.values.set(key, expense);
    return expense;
  }
}

describe("RecordExpense", () => {
  it("records an organization expense once per reference", async () => {
    const expenses = new MemoryExpenses();
    const record = new RecordExpense(
      expenses,
      { next: () => Identifier.fromString("expense") },
      { now: () => new Date("2026-09-02T10:00:00.000Z") },
    );
    const input = {
      organizationId: "org",
      categoryId: "category",
      shopId: null,
      amountMinor: 1500,
      currency: "XOF",
      reference: " DEP-001 ",
      description: "Loyer Ɛ",
      actorId: "actor",
    };
    await expect(record.execute(input)).resolves.toMatchObject({
      shopId: null,
      reference: "DEP-001",
      occurredAt: new Date("2026-09-02T10:00:00.000Z"),
    });
    await expect(
      record.execute({ ...input, amountMinor: 9999 }),
    ).resolves.toMatchObject({ amount: { amountMinor: 1500 } });
  });
});

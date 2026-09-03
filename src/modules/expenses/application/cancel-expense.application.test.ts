import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import type { ExpenseCancellationRepository } from "./ports/expense-cancellation-repository";
import { CancelExpense } from "./cancel-expense";
import type { ExpenseCancellation } from "../domain/expense-cancellation";

class MemoryCancellations implements ExpenseCancellationRepository {
  private readonly values = new Map<string, ExpenseCancellation>();
  public async findByReference(
    organizationId: string,
    reference: string,
  ): Promise<ExpenseCancellation | null> {
    return this.values.get(`${organizationId}:${reference}`) ?? null;
  }
  public async cancel(
    cancellation: ExpenseCancellation,
  ): Promise<ExpenseCancellation> {
    const key = `${cancellation.organizationId.value}:${cancellation.reference}`;
    const byReference = this.values.get(key);
    if (byReference !== undefined) return byReference;
    if (
      [...this.values.values()].some(
        (value) => value.expenseId.value === cancellation.expenseId.value,
      )
    )
      throw Object.assign(new Error("already cancelled"), {
        code: "expenses.already_cancelled",
      });
    this.values.set(key, cancellation);
    return cancellation;
  }
}

describe("CancelExpense", () => {
  it("records a motivated cancellation once and rejects a reused reference", async () => {
    const cancellations = new MemoryCancellations();
    const cancel = new CancelExpense(
      cancellations,
      { next: () => Identifier.fromString("cancellation") },
      { now: () => new Date("2026-09-02T11:00:00.000Z") },
    );
    const input = {
      organizationId: "org",
      expenseId: "expense",
      reference: " ANN-001 ",
      reason: "Saisie Ɛ erronée",
      actorId: "actor",
    };
    await expect(cancel.execute(input)).resolves.toMatchObject({
      reference: "ANN-001",
      reason: "Saisie Ɛ erronée",
      cancelledAt: new Date("2026-09-02T11:00:00.000Z"),
    });
    await expect(
      cancel.execute({ ...input, reason: "Autre motif" }),
    ).resolves.toMatchObject({
      reference: "ANN-001",
      reason: "Saisie Ɛ erronée",
    });
    await expect(
      cancel.execute({ ...input, expenseId: "other-expense" }),
    ).rejects.toMatchObject({ code: "expenses.cancellation_reference_taken" });
  });
});

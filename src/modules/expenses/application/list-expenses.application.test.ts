import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/domain/domain-error";
import type { ExpenseConsultationRepository } from "./ports/expense-consultation-repository";
import type {
  ExpenseReadAuthorization,
  ExpenseReadScope,
} from "./ports/expense-read-authorization";
import { ListExpenses } from "./list-expenses";

class Authorization implements ExpenseReadAuthorization {
  public async authorize(
    _organizationId: string,
    requestedShopId: string | null,
    actorId: string | null,
  ): Promise<ExpenseReadScope> {
    if (actorId !== "manager")
      throw new DomainError("expenses.read_forbidden", "Forbidden");
    if (requestedShopId === "other")
      throw new DomainError("expenses.read_forbidden", "Forbidden");
    return { shopIds: requestedShopId === null ? ["shop"] : [requestedShopId] };
  }
}
class Expenses implements ExpenseConsultationRepository {
  public scope: ExpenseReadScope | null = null;
  public async list(
    _organizationId: string,
    _filter: Parameters<ExpenseConsultationRepository["list"]>[1],
    scope: ExpenseReadScope,
  ) {
    this.scope = scope;
    return [];
  }
}

describe("ListExpenses", () => {
  it("builds a normalized filter and delegates only an authorized shop scope", async () => {
    const expenses = new Expenses();
    await expect(
      new ListExpenses(expenses, new Authorization()).execute({
        organizationId: "org",
        actorId: "manager",
        shopId: "shop",
        query: " Ɛ ",
        status: "ALL",
      }),
    ).resolves.toEqual([]);
    expect(expenses.scope).toEqual({ shopIds: ["shop"] });
    await expect(
      new ListExpenses(expenses, new Authorization()).execute({
        organizationId: "org",
        actorId: "manager",
        shopId: "other",
      }),
    ).rejects.toMatchObject({ code: "expenses.read_forbidden" });
  });
});

import { describe, expect, it } from "vitest";
import { ExpenseConsultationFilter } from "./expense-consultation-filter";

describe("ExpenseConsultationFilter", () => {
  it("preserves normalized Unicode text and explicit filters", () => {
    const filter = ExpenseConsultationFilter.create({
      shopId: "shop",
      categoryId: "category",
      query: "  Fɔ́lɔ Ɛ  ",
      occurredFrom: new Date("2026-09-01"),
      occurredTo: new Date("2026-09-02"),
      status: "CANCELLED",
    });
    expect(filter).toMatchObject({
      shopId: { value: "shop" },
      categoryId: { value: "category" },
      query: "Fɔ́lɔ Ɛ".normalize("NFC"),
      status: "CANCELLED",
    });
  });

  it("rejects unsupported statuses and inverted date ranges", () => {
    expect(() =>
      ExpenseConsultationFilter.create({ status: "PENDING" }),
    ).toThrow(
      expect.objectContaining({ code: "expenses.invalid_status_filter" }),
    );
    expect(() =>
      ExpenseConsultationFilter.create({
        occurredFrom: new Date("2026-09-03"),
        occurredTo: new Date("2026-09-02"),
      }),
    ).toThrow(expect.objectContaining({ code: "expenses.invalid_date_range" }));
  });
});

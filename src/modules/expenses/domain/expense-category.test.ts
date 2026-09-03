import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { ExpenseCategory } from "./expense-category";

describe("ExpenseCategory", () => {
  it("preserves NFC Unicode and its organization while changing lifecycle", () => {
    const category = ExpenseCategory.create(
      Identifier.fromString("category"),
      Identifier.fromString("org"),
      "  Lɔgɛlɛn Fɔ́lɔ  ",
    )
      .deactivate()
      .activate();
    expect(category).toMatchObject({
      organizationId: { value: "org" },
      name: "Lɔgɛlɛn Fɔ́lɔ".normalize("NFC"),
      isActive: true,
    });
  });
  it("rejects an empty name", () => {
    expect(() =>
      ExpenseCategory.create(
        Identifier.fromString("category"),
        Identifier.fromString("org"),
        " ",
      ),
    ).toThrow(
      expect.objectContaining({ code: "expenses.invalid_category_name" }),
    );
  });
});

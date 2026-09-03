import { describe, expect, it } from "vitest";

import { DomainError } from "./domain-error";
import { Identifier } from "./identifier";
import { Money } from "./money";
import { Quantity } from "./quantity";

function expectErrorCode(action: () => unknown, code: string): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).code).toBe(code);
    return;
  }

  throw new Error("Expected a DomainError.");
}

describe("Shared Kernel", () => {
  it("keeps identifiers opaque and rejects empty or padded values", () => {
    expect(
      Identifier.fromString("org_01").equals(Identifier.fromString("org_01")),
    ).toBe(true);
    expect(() => Identifier.fromString(" org_01 ")).toThrow(DomainError);
    expectErrorCode(
      () => Identifier.fromString("   "),
      "shared.invalid_identifier",
    );
  });

  it("stores money as integer minor units and prevents currency mixing", () => {
    expect(
      Money.fromMinor(2500, "XOF").add(Money.fromMinor(500, "XOF")).amountMinor,
    ).toBe(3000);
    expectErrorCode(
      () => Money.fromMinor(12.5, "XOF"),
      "shared.invalid_money_amount",
    );
    expectErrorCode(
      () => Money.fromMinor(2500, "XOF").add(Money.fromMinor(1, "EUR")),
      "shared.currency_mismatch",
    );
  });

  it("requires finite non-negative quantities", () => {
    expect(Quantity.fromNumber(0.5).isPositive()).toBe(true);
    expect(Quantity.zero().add(Quantity.fromNumber(2)).value).toBe(2);
    expectErrorCode(() => Quantity.fromNumber(-1), "shared.invalid_quantity");
    expectErrorCode(
      () => Quantity.fromNumber(Number.NaN),
      "shared.invalid_quantity",
    );
  });
});

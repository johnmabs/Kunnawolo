import { DomainError } from "./domain-error";

export class Quantity {
  private constructor(public readonly value: number) {}

  public static fromNumber(value: number): Quantity {
    if (!Number.isFinite(value) || value < 0) {
      throw new DomainError(
        "shared.invalid_quantity",
        "A quantity must be a finite non-negative number.",
      );
    }

    return new Quantity(value);
  }

  public static zero(): Quantity {
    return new Quantity(0);
  }

  public add(other: Quantity): Quantity {
    return Quantity.fromNumber(this.value + other.value);
  }

  public isPositive(): boolean {
    return this.value > 0;
  }
}

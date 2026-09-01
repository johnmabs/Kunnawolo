import { DomainError } from "./domain-error";

export class Money {
  private constructor(
    public readonly amountMinor: number,
    public readonly currency: string,
  ) {}

  public static fromMinor(amountMinor: number, currency: string): Money {
    if (!Number.isSafeInteger(amountMinor)) {
      throw new DomainError("shared.invalid_money_amount", "A money amount must be a safe integer in minor units.");
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new DomainError("shared.invalid_currency", "A currency must be a three-letter ISO code.");
    }

    return new Money(amountMinor, currency);
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new DomainError("shared.currency_mismatch", "Money values must use the same currency.");
    }

    return Money.fromMinor(this.amountMinor + other.amountMinor, this.currency);
  }

  public isPositive(): boolean {
    return this.amountMinor > 0;
  }
}

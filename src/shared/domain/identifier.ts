import { DomainError } from "./domain-error";

export class Identifier {
  private constructor(public readonly value: string) {}

  public static fromString(value: string): Identifier {
    if (value.trim().length === 0 || value !== value.trim()) {
      throw new DomainError(
        "shared.invalid_identifier",
        "An identifier must be non-empty and trimmed.",
      );
    }

    return new Identifier(value);
  }

  public equals(other: Identifier): boolean {
    return this.value === other.value;
  }
}

import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class UserAccount {
  private constructor(public readonly id: Identifier, public readonly email: string, public readonly displayName: string) {}
  public static create(id: Identifier, email: string, displayName: string): UserAccount {
    const normalizedEmail = email.trim().normalize("NFC").toLowerCase();
    const normalizedName = displayName.trim().normalize("NFC");
    if (!normalizedEmail.includes("@") || normalizedName.length === 0) throw new DomainError("iam.invalid_account", "A valid email and display name are required.");
    return new UserAccount(id, normalizedEmail, normalizedName);
  }
}

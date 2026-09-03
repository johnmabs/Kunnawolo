import { DomainError } from "@/shared/domain/domain-error";

export class PasswordPolicy {
  public static validate(password: string): string {
    const length = Array.from(password).length;
    if (length < 15)
      throw new DomainError(
        "auth.password_too_short",
        "A password must contain at least 15 characters.",
      );
    if (length > 128)
      throw new DomainError(
        "auth.password_too_long",
        "A password must contain at most 128 characters.",
      );
    return password;
  }
}

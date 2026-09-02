import { DomainError } from "@/shared/domain/domain-error";
import type { UserAccount } from "../domain/user-account";
import type { PasswordHasher } from "./ports/password-hasher";
import type { WebAuthenticationRepository } from "./ports/web-authentication-repository";

export class LoginWithPassword {
  public constructor(private readonly repository: WebAuthenticationRepository, private readonly passwords: PasswordHasher) {}

  public async execute(input: Readonly<{ email: string; password: string }>): Promise<UserAccount> {
    const email = input.email.trim().normalize("NFC").toLowerCase();
    const found = await this.repository.findAccountWithCredentialByEmail(email);
    const valid = found === null
      ? (await this.passwords.consume(input.password), false)
      : await this.passwords.verify(input.password, found.credential);
    if (!valid || found === null) throw new DomainError("auth.invalid_credentials", "The email or password is invalid.");
    return found.account;
  }
}

import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { DomainError } from "@/shared/domain/domain-error";
import { UserAccount } from "../domain/user-account";
import type { PasswordHasher } from "./ports/password-hasher";
import type { WebAuthenticationRepository } from "./ports/web-authentication-repository";

export class RegisterWithPassword {
  public constructor(
    private readonly repository: WebAuthenticationRepository,
    private readonly passwords: PasswordHasher,
    private readonly identifiers: IdentifierGenerator,
  ) {}

  public async execute(input: Readonly<{ email: string; displayName: string; password: string }>): Promise<UserAccount> {
    const account = UserAccount.create(this.identifiers.next(), input.email, input.displayName);
    if (await this.repository.findAccountWithCredentialByEmail(account.email)) {
      throw new DomainError("auth.email_taken", "An account already exists for this email.");
    }
    const credential = await this.passwords.create(input.password);
    await this.repository.createAccount(account, credential);
    return account;
  }
}

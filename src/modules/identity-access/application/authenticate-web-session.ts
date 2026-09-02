import type { Clock } from "@/shared/domain/clock";
import { DomainError } from "@/shared/domain/domain-error";
import type { UserAccount } from "../domain/user-account";
import type { OpaqueTokenHasher } from "./ports/opaque-token";
import type { WebAuthenticationRepository } from "./ports/web-authentication-repository";

export class AuthenticateWebSession {
  public constructor(private readonly repository: WebAuthenticationRepository, private readonly tokenHasher: OpaqueTokenHasher, private readonly clock: Clock) {}

  public async execute(token: string): Promise<UserAccount> {
    const session = token.length === 0 ? null : await this.repository.findSessionByTokenHash(this.tokenHasher.hash(token));
    if (session === null || !session.isActive(this.clock.now())) throw new DomainError("auth.invalid_session", "The session is not active.");
    const account = await this.repository.findAccountById(session.userAccountId.value);
    if (account === null) throw new DomainError("auth.invalid_session", "The session is not active.");
    return account;
  }
}

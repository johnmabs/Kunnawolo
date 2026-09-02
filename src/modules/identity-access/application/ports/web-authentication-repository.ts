import type { PasswordHash } from "./password-hasher";
import type { UserAccount } from "../../domain/user-account";
import type { WebSession } from "../../domain/web-session";

export type AccountWithCredential = Readonly<{ account: UserAccount; credential: PasswordHash }>;

export interface WebAuthenticationRepository {
  findAccountWithCredentialByEmail(email: string): Promise<AccountWithCredential | null>;
  findAccountById(userAccountId: string): Promise<UserAccount | null>;
  createAccount(account: UserAccount, credential: PasswordHash): Promise<void>;
  saveSession(session: WebSession): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<WebSession | null>;
}

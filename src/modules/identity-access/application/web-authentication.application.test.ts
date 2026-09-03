import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { UserAccount } from "../domain/user-account";
import { WebSession } from "../domain/web-session";
import { AuthenticateWebSession } from "./authenticate-web-session";
import { IssueWebSession } from "./issue-web-session";
import { LoginWithPassword } from "./login-with-password";
import { LogoutWebSession } from "./logout-web-session";
import { RegisterWithPassword } from "./register-with-password";
import type { PasswordHash, PasswordHasher } from "./ports/password-hasher";
import type { WebAuthenticationRepository } from "./ports/web-authentication-repository";

class MemoryAuthentication implements WebAuthenticationRepository {
  public accounts = new Map<
    string,
    { account: UserAccount; credential: PasswordHash }
  >();
  public sessions = new Map<string, WebSession>();
  public async findAccountWithCredentialByEmail(email: string) {
    return this.accounts.get(email) ?? null;
  }
  public async findAccountById(id: string) {
    return (
      [...this.accounts.values()].find(({ account }) => account.id.value === id)
        ?.account ?? null
    );
  }
  public async createAccount(account: UserAccount, credential: PasswordHash) {
    this.accounts.set(account.email, { account, credential });
  }
  public async saveSession(session: WebSession) {
    this.sessions.set(session.tokenHash, session);
  }
  public async findSessionByTokenHash(hash: string) {
    return this.sessions.get(hash) ?? null;
  }
}
class Passwords implements PasswordHasher {
  public consumed = 0;
  public async create(password: string) {
    this.created += 1;
    return { algorithm: "test", salt: "salt", hash: password };
  }
  public async verify(password: string, stored: PasswordHash) {
    return stored.hash === password;
  }
  public async consume() {
    this.consumed += 1;
  }
  private created = 0;
}

describe("web authentication application", () => {
  const ids = { next: () => Identifier.fromString(crypto.randomUUID()) };
  const tokens = { generate: () => "opaque-token", hash: () => "a".repeat(64) };
  const clock = { now: () => new Date("2026-09-02T12:00:00.000Z") };

  it("registers and authenticates an account without changing the password", async () => {
    const repository = new MemoryAuthentication();
    const passwords = new Passwords();
    const registered = await new RegisterWithPassword(
      repository,
      passwords,
      ids,
    ).execute({
      email: " JEAN@example.com ",
      displayName: " Jean ",
      password: "phrase secrète très longue",
    });
    await expect(
      new LoginWithPassword(repository, passwords).execute({
        email: "jean@example.com",
        password: "phrase secrète très longue",
      }),
    ).resolves.toEqual(registered);
  });

  it("does password work even when the account does not exist", async () => {
    const passwords = new Passwords();
    await expect(
      new LoginWithPassword(new MemoryAuthentication(), passwords).execute({
        email: "absent@example.com",
        password: "phrase secrète très longue",
      }),
    ).rejects.toMatchObject({ code: "auth.invalid_credentials" });
    expect(passwords.consumed).toBe(1);
  });

  it("issues, authenticates, and revokes an opaque server session", async () => {
    const repository = new MemoryAuthentication();
    const account = UserAccount.create(ids.next(), "jean@example.com", "Jean");
    await repository.createAccount(account, {
      algorithm: "test",
      salt: "salt",
      hash: "hash",
    });
    const issued = await new IssueWebSession(
      repository,
      ids,
      tokens,
      tokens,
      clock,
    ).execute(account.id.value);
    await expect(
      new AuthenticateWebSession(repository, tokens, clock).execute(
        issued.token,
      ),
    ).resolves.toEqual(account);
    await new LogoutWebSession(repository, tokens, clock).execute(issued.token);
    await expect(
      new AuthenticateWebSession(repository, tokens, clock).execute(
        issued.token,
      ),
    ).rejects.toMatchObject({ code: "auth.invalid_session" });
  });
});

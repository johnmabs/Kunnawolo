import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class WebSession {
  private constructor(
    public readonly id: Identifier,
    public readonly userAccountId: Identifier,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly lastSeenAt: Date,
  ) {}
  public static issue(
    input: Readonly<{
      id: Identifier;
      userAccountId: Identifier;
      tokenHash: string;
      expiresAt: Date;
      issuedAt: Date;
    }>,
  ) {
    if (!/^[a-f0-9]{64}$/.test(input.tokenHash))
      throw new DomainError(
        "auth.invalid_session_token",
        "A session token hash is invalid.",
      );
    if (input.expiresAt <= input.issuedAt)
      throw new DomainError(
        "auth.invalid_session_expiry",
        "A session expiry must be in the future.",
      );
    return new WebSession(
      input.id,
      input.userAccountId,
      input.tokenHash,
      input.expiresAt,
      null,
      input.issuedAt,
    );
  }
  public static restore(
    input: Readonly<{
      id: Identifier;
      userAccountId: Identifier;
      tokenHash: string;
      expiresAt: Date;
      revokedAt: Date | null;
      lastSeenAt: Date;
    }>,
  ) {
    return new WebSession(
      input.id,
      input.userAccountId,
      input.tokenHash,
      input.expiresAt,
      input.revokedAt,
      input.lastSeenAt,
    );
  }
  public isActive(at: Date) {
    return this.revokedAt === null && this.expiresAt > at;
  }
  public revoke(at: Date) {
    return this.revokedAt === null
      ? new WebSession(
          this.id,
          this.userAccountId,
          this.tokenHash,
          this.expiresAt,
          at,
          this.lastSeenAt,
        )
      : this;
  }
  public touch(at: Date) {
    if (!this.isActive(at))
      throw new DomainError(
        "auth.invalid_session",
        "The session is not active.",
      );
    return new WebSession(
      this.id,
      this.userAccountId,
      this.tokenHash,
      this.expiresAt,
      null,
      at,
    );
  }
}

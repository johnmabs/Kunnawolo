import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class ApiAccessKey {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly actorId: Identifier,
    public readonly label: string,
    public readonly secretSalt: string,
    public readonly secretHash: string,
    public readonly expiresAt: Date | null,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  public static issue(
    input: Readonly<{
      id: Identifier;
      organizationId: Identifier;
      actorId: Identifier;
      label: string;
      secretSalt: string;
      secretHash: string;
      expiresAt: Date | null;
      createdAt: Date;
    }>,
  ): ApiAccessKey {
    const label = input.label.trim().normalize("NFC");
    if (label.length === 0)
      throw new DomainError(
        "security.invalid_api_key_label",
        "An API key label must be non-empty.",
      );
    if (input.expiresAt !== null && input.expiresAt <= input.createdAt)
      throw new DomainError(
        "security.invalid_api_key_expiry",
        "An API key expiry must be in the future.",
      );
    return new ApiAccessKey(
      input.id,
      input.organizationId,
      input.actorId,
      label,
      input.secretSalt,
      input.secretHash,
      input.expiresAt,
      null,
      input.createdAt,
    );
  }

  public static restore(
    input: Readonly<{
      id: Identifier;
      organizationId: Identifier;
      actorId: Identifier;
      label: string;
      secretSalt: string;
      secretHash: string;
      expiresAt: Date | null;
      revokedAt: Date | null;
      createdAt: Date;
    }>,
  ): ApiAccessKey {
    return new ApiAccessKey(
      input.id,
      input.organizationId,
      input.actorId,
      input.label,
      input.secretSalt,
      input.secretHash,
      input.expiresAt,
      input.revokedAt,
      input.createdAt,
    );
  }

  public revoke(at: Date): ApiAccessKey {
    if (this.revokedAt !== null) return this;
    return new ApiAccessKey(
      this.id,
      this.organizationId,
      this.actorId,
      this.label,
      this.secretSalt,
      this.secretHash,
      this.expiresAt,
      at,
      this.createdAt,
    );
  }

  public isUsable(at: Date): boolean {
    return (
      this.revokedAt === null &&
      (this.expiresAt === null || this.expiresAt > at)
    );
  }
}

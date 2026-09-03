import { DomainError } from "@/shared/domain/domain-error";
import type { Clock } from "@/shared/domain/clock";
import type { ApiAccessKeyRepository } from "./ports/api-access-key-repository";
import type { ApiKeyAccessAuthorization } from "./ports/api-key-access-authorization";

export class RevokeOrganizationApiKey {
  public constructor(
    private readonly keys: ApiAccessKeyRepository,
    private readonly authorization: ApiKeyAccessAuthorization,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: Readonly<{ organizationId: string; actorId: string; keyId: string }>,
  ): Promise<void> {
    await this.authorization.authorizeOwner(
      input.organizationId,
      input.actorId,
    );
    const key = await this.keys.findByOrganizationAndId(
      input.organizationId,
      input.keyId,
    );
    if (key === null)
      throw new DomainError(
        "security.api_key_not_found",
        "The API key does not belong to this organization.",
      );
    await this.keys.save(key.revoke(this.clock.now()), {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: `api_key.revoked:${key.label}`,
    });
  }
}

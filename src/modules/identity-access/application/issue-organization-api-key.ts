import type { Clock } from "@/shared/domain/clock";
import { Identifier } from "@/shared/domain/identifier";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { ApiAccessKey } from "../domain/api-access-key";
import type { ApiAccessKeyRepository } from "./ports/api-access-key-repository";
import type { ApiKeyAccessAuthorization } from "./ports/api-key-access-authorization";
import type { ApiSecretGenerator } from "./ports/api-secret-generator";
import type { ApiSecretHasher } from "./ports/api-secret-hasher";

export type IssuedApiAccessKey = Readonly<{ key: ApiAccessKey; token: string }>;

export class IssueOrganizationApiKey {
  public constructor(
    private readonly keys: ApiAccessKeyRepository,
    private readonly authorization: ApiKeyAccessAuthorization,
    private readonly ids: IdentifierGenerator,
    private readonly secrets: ApiSecretGenerator,
    private readonly hasher: ApiSecretHasher,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      actorId: string;
      label: string;
      expiresAt?: Date | null;
    }>,
  ): Promise<IssuedApiAccessKey> {
    await this.authorization.authorizeOwner(
      input.organizationId,
      input.actorId,
    );
    const secret = this.secrets.generate();
    const hash = await this.hasher.create(secret);
    const key = ApiAccessKey.issue({
      id: this.ids.next(),
      organizationId: Identifier.fromString(input.organizationId),
      actorId: Identifier.fromString(input.actorId),
      label: input.label,
      secretSalt: hash.salt,
      secretHash: hash.hash,
      expiresAt: input.expiresAt ?? null,
      createdAt: this.clock.now(),
    });
    await this.keys.save(key, {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: `api_key.issued:${key.label}`,
    });
    return { key, token: `${key.id.value}.${secret}` };
  }
}

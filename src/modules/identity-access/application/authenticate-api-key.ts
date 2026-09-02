import { DomainError } from "@/shared/domain/domain-error";
import type { Clock } from "@/shared/domain/clock";
import { ApiKeyToken } from "../domain/api-key-token";
import type { ApiAccessKeyRepository } from "./ports/api-access-key-repository";
import type { ApiKeyAccessAuthorization } from "./ports/api-key-access-authorization";
import type { ApiSecretHasher } from "./ports/api-secret-hasher";

export type ApiAccessContext = Readonly<{ organizationId: string; actorId: string }>;

export class AuthenticateApiKey {
  public constructor(private readonly keys: ApiAccessKeyRepository, private readonly authorization: ApiKeyAccessAuthorization, private readonly hasher: ApiSecretHasher, private readonly clock: Clock) {}

  public async execute(tokenValue: string): Promise<ApiAccessContext> {
    const token = ApiKeyToken.parse(tokenValue);
    const key = await this.keys.findById(token.keyId.value);
    if (key === null || !key.isUsable(this.clock.now()) || !(await this.hasher.verify(token.secret, { salt: key.secretSalt, hash: key.secretHash }))) throw new DomainError("security.invalid_api_key", "The API key is invalid.");
    await this.authorization.authorizeActiveMembership(key.organizationId.value, key.actorId.value);
    return { organizationId: key.organizationId.value, actorId: key.actorId.value };
  }
}

import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { AuthenticateApiKey } from "./authenticate-api-key";
import { IssueOrganizationApiKey } from "./issue-organization-api-key";
import { RevokeOrganizationApiKey } from "./revoke-organization-api-key";
import type { ApiAccessKeyRepository, ApiKeyAudit } from "./ports/api-access-key-repository";
import type { ApiKeyAccessAuthorization } from "./ports/api-key-access-authorization";
import type { ApiSecretGenerator } from "./ports/api-secret-generator";
import type { ApiSecretHash, ApiSecretHasher } from "./ports/api-secret-hasher";
import type { ApiAccessKey } from "../domain/api-access-key";

class Keys implements ApiAccessKeyRepository {
  public key: ApiAccessKey | null = null;
  public audits: ApiKeyAudit[] = [];
  public async findById(id: string) { return this.key?.id.value === id ? this.key : null; }
  public async findByOrganizationAndId(organizationId: string, id: string) { return this.key?.organizationId.value === organizationId && this.key.id.value === id ? this.key : null; }
  public async save(key: ApiAccessKey, audit: ApiKeyAudit) { this.key = key; this.audits.push(audit); }
}
class Authorization implements ApiKeyAccessAuthorization { public async authorizeActiveMembership() {} public async authorizeOwner() {} }
class Secrets implements ApiSecretGenerator, ApiSecretHasher { public generate() { return "a".repeat(43); } public async create(secret: string): Promise<ApiSecretHash> { return { salt: "salt", hash: `hash:${secret}` }; } public async verify(secret: string, stored: ApiSecretHash) { return stored.hash === `hash:${secret}`; } }

describe("organization API keys", () => {
  it("issues, authenticates, and revokes an organization-scoped secret idempotently", async () => {
    const keys = new Keys();
    const clock = { now: () => new Date("2026-09-02T12:00:00.000Z") };
    const issue = new IssueOrganizationApiKey(keys, new Authorization(), { next: () => Identifier.fromString("key-id") }, new Secrets(), new Secrets(), clock);
    const issued = await issue.execute({ organizationId: "org", actorId: "owner", label: "  Clé Ɛ  " });
    await expect(new AuthenticateApiKey(keys, new Authorization(), new Secrets(), clock).execute(issued.token)).resolves.toEqual({ organizationId: "org", actorId: "owner" });
    await new RevokeOrganizationApiKey(keys, new Authorization(), clock).execute({ organizationId: "org", actorId: "owner", keyId: "key-id" });
    await expect(new AuthenticateApiKey(keys, new Authorization(), new Secrets(), clock).execute(issued.token)).rejects.toMatchObject({ code: "security.invalid_api_key" });
    expect(keys.audits.map(({ action }) => action)).toEqual(["api_key.issued:Clé Ɛ", "api_key.revoked:Clé Ɛ"]);
  });
});

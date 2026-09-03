import type { ApiAccessKey } from "../../domain/api-access-key";

export type ApiKeyAudit = Readonly<{
  organizationId: string;
  actorId: string;
  action: string;
}>;

export interface ApiAccessKeyRepository {
  findById(id: string): Promise<ApiAccessKey | null>;
  findByOrganizationAndId(
    organizationId: string,
    id: string,
  ): Promise<ApiAccessKey | null>;
  save(key: ApiAccessKey, audit: ApiKeyAudit): Promise<void>;
}

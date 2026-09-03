export interface ApiKeyAccessAuthorization {
  authorizeActiveMembership(
    organizationId: string,
    actorId: string,
  ): Promise<void>;
  authorizeOwner(organizationId: string, actorId: string): Promise<void>;
}

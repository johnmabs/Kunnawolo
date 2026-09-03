export interface WorkspacePreferenceAuthorization {
  authorize(
    organizationId: string,
    actorId: string,
    shopId: string | null,
  ): Promise<void>;
}

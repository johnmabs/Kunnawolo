export interface TransfersDispatchAuthorization {
  authorize(
    organizationId: string,
    sourceShopId: string,
    actorId: string | null,
  ): Promise<void>;
}

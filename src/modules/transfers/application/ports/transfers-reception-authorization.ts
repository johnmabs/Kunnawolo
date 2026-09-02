export interface TransfersReceptionAuthorization {
  authorize(organizationId: string, destinationShopId: string, actorId: string | null): Promise<void>;
}

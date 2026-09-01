export interface SalesCancellationAuthorization { authorize(organizationId: string, shopId: string, actorId: string | null): Promise<void>; }

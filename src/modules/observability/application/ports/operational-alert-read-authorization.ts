export interface OperationalAlertReadAuthorization { authorize(organizationId: string, actorId: string, shopId: string | null): Promise<void>; }

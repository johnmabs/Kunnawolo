export interface ReportingReadAuthorization {
  authorize(organizationId: string, shopId: string | null, actorId: string | null): Promise<void>;
}

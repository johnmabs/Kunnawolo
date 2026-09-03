export interface TransfersReportingSource {
  inTransitQuantity(
    input: Readonly<{ organizationId: string; shopId: string | null }>,
  ): Promise<number>;
}

export type FinalizedSaleSnapshot = Readonly<{
  shopId: string;
  finalizedAt: Date;
  currency: string;
  revenueMinor: number;
  costMinor: number;
}>;
export type SalesReportingData = Readonly<{
  currency: string;
  sales: readonly FinalizedSaleSnapshot[];
}>;

export interface SalesReportingSource {
  listFinalizedSales(
    input: Readonly<{
      organizationId: string;
      shopId: string | null;
      occurredFrom: Date | null;
      occurredTo: Date | null;
    }>,
  ): Promise<SalesReportingData>;
}

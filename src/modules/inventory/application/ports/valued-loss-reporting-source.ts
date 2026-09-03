export interface ValuedLossReportingSource {
  valuedLossAmount(
    input: Readonly<{
      organizationId: string;
      shopId: string | null;
      occurredFrom: Date | null;
      occurredTo: Date | null;
    }>,
  ): Promise<Readonly<{ currency: string; amountMinor: number }>>;
}

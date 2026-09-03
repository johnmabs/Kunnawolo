export interface OperationalLogger {
  info(
    event: Readonly<{
      organizationId: string;
      shopId: string | null;
      action: string;
      reference: string;
      correlationId: string;
      durationMillis: number;
    }>,
  ): void;
}

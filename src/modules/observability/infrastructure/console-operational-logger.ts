import type { OperationalLogger } from "../application/ports/operational-logger";

export class ConsoleOperationalLogger implements OperationalLogger {
  public info(
    event: Readonly<{
      organizationId: string;
      shopId: string | null;
      action: string;
      reference: string;
      correlationId: string;
      durationMillis: number;
    }>,
  ): void {
    console.info(
      JSON.stringify({ level: "info", event: "operation_observed", ...event }),
    );
  }
}

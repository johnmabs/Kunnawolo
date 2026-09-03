import { OperationalAlertPageQuery } from "../domain/operational-alert-page-query";
import type { OperationalAlertReadAuthorization } from "./ports/operational-alert-read-authorization";
import type {
  OperationalAlertPage,
  OperationalAlertRepository,
} from "./ports/operational-alert-repository";

export class ListOperationalAlerts {
  public constructor(
    private readonly alerts: OperationalAlertRepository,
    private readonly authorization: OperationalAlertReadAuthorization,
  ) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      actorId: string;
      shopId?: string | null;
      limit?: number | null;
      cursor?: string | null;
    }>,
  ): Promise<OperationalAlertPage> {
    const query = OperationalAlertPageQuery.create(input);
    await this.authorization.authorize(
      query.organizationId.value,
      input.actorId,
      query.shopId?.value ?? null,
    );
    return this.alerts.list(query);
  }
}

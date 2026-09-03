import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { OperationalAlertPageQuery } from "../domain/operational-alert-page-query";
import type {
  OperationalAlertPage,
  OperationalAlertRepository,
} from "../application/ports/operational-alert-repository";

export class PrismaOperationalAlertRepository implements OperationalAlertRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async list(
    query: OperationalAlertPageQuery,
  ): Promise<OperationalAlertPage> {
    const cursor = query.cursor;
    const rows = await this.prisma.operationalAlert.findMany({
      where: {
        organizationId: query.organizationId.value,
        ...(query.shopId === null ? {} : { shopId: query.shopId.value }),
        ...(cursor === null
          ? {}
          : {
              OR: [
                { occurredAt: { lt: cursor.occurredAt } },
                { occurredAt: cursor.occurredAt, id: { lt: cursor.id } },
              ],
            }),
      },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      select: {
        id: true,
        shopId: true,
        code: true,
        severity: true,
        reference: true,
        occurredAt: true,
      },
    });
    const items = rows.slice(0, query.limit);
    return {
      items,
      nextCursor:
        rows.length > query.limit && items.length > 0
          ? OperationalAlertPageQuery.cursorOf(items[items.length - 1]!)
          : null,
    };
  }
}

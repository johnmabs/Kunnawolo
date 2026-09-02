import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class OperationalAlertPageQuery {
  private constructor(public readonly organizationId: Identifier, public readonly shopId: Identifier | null, public readonly limit: number, public readonly cursor: Readonly<{ occurredAt: Date; id: string }> | null) {}

  public static create(input: Readonly<{ organizationId: string; shopId?: string | null; limit?: number | null; cursor?: string | null }>): OperationalAlertPageQuery {
    const limit = input.limit ?? 25;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new DomainError("observability.invalid_page_limit", "The alert page limit must be between 1 and 100.");
    const cursor = input.cursor === null || input.cursor === undefined ? null : OperationalAlertPageQuery.parseCursor(input.cursor);
    return new OperationalAlertPageQuery(Identifier.fromString(input.organizationId), input.shopId === null || input.shopId === undefined ? null : Identifier.fromString(input.shopId), limit, cursor);
  }

  private static parseCursor(value: string): Readonly<{ occurredAt: Date; id: string }> {
    const [timestamp, id, ...rest] = value.split("|");
    const occurredAt = timestamp === undefined ? null : new Date(timestamp);
    if (timestamp === undefined || id === undefined || rest.length !== 0 || occurredAt === null || Number.isNaN(occurredAt.getTime()) || id.trim().length === 0) throw new DomainError("observability.invalid_page_cursor", "The alert page cursor is invalid.");
    return { occurredAt, id };
  }

  public static cursorOf(item: Readonly<{ occurredAt: Date; id: string }>): string { return `${item.occurredAt.toISOString()}|${item.id}`; }
}

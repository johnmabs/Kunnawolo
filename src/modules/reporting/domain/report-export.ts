import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { DashboardFilter } from "./dashboard-filter";

export class ReportExport {
  private constructor(
    public readonly id: Identifier,
    public readonly filter: DashboardFilter,
    public readonly reference: string,
    public readonly actorId: Identifier,
    public readonly content: string,
    public readonly exportedAt: Date,
  ) {}

  public static create(
    input: Readonly<{
      id: string;
      filter: DashboardFilter;
      reference: string;
      actorId: string;
      content: string;
      exportedAt: Date;
    }>,
  ): ReportExport {
    const reference = input.reference.trim().normalize("NFC");
    if (reference.length === 0)
      throw new DomainError(
        "reporting.invalid_export_reference",
        "An export reference must be non-empty.",
      );
    if (input.content.length === 0)
      throw new DomainError(
        "reporting.invalid_export_content",
        "An export must contain CSV content.",
      );
    return new ReportExport(
      Identifier.fromString(input.id),
      input.filter,
      reference,
      Identifier.fromString(input.actorId),
      input.content,
      input.exportedAt,
    );
  }
}

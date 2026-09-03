import { Identifier } from "@/shared/domain/identifier";

export class WorkspacePreference {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly actorId: Identifier,
    public readonly shopId: Identifier | null,
    public readonly isCompact: boolean,
  ) {}

  public static configure(
    input: Readonly<{
      id: string;
      organizationId: string;
      actorId: string;
      shopId?: string | null;
      isCompact?: boolean;
    }>,
  ): WorkspacePreference {
    return new WorkspacePreference(
      Identifier.fromString(input.id),
      Identifier.fromString(input.organizationId),
      Identifier.fromString(input.actorId),
      input.shopId === null || input.shopId === undefined
        ? null
        : Identifier.fromString(input.shopId),
      input.isCompact ?? false,
    );
  }
}

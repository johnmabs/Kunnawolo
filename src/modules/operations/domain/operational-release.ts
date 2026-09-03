import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class OperationalRelease {
  private constructor(
    public readonly id: Identifier,
    public readonly version: string,
    public readonly reference: string,
    public readonly artifactSha: string,
    public readonly actorId: Identifier | null,
    public readonly releasedAt: Date,
  ) {}

  public static register(
    input: Readonly<{
      id: string;
      version: string;
      reference: string;
      artifactSha: string;
      actorId?: string | null;
      releasedAt: Date;
    }>,
  ): OperationalRelease {
    const version = input.version.trim();
    const reference = input.reference.trim().normalize("NFC");
    const artifactSha = input.artifactSha.trim().toLowerCase();
    if (version.length === 0 || reference.length === 0)
      throw new DomainError(
        "operations.invalid_release",
        "A release version and reference are required.",
      );
    if (!/^[a-f0-9]{64}$/.test(artifactSha))
      throw new DomainError(
        "operations.invalid_artifact_sha",
        "A release artifact checksum must be a SHA-256 hex digest.",
      );
    return new OperationalRelease(
      Identifier.fromString(input.id),
      version,
      reference,
      artifactSha,
      input.actorId === null || input.actorId === undefined
        ? null
        : Identifier.fromString(input.actorId),
      input.releasedAt,
    );
  }
}

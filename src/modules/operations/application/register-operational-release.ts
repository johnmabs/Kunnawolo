import type { Clock } from "@/shared/domain/clock";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { DomainError } from "@/shared/domain/domain-error";
import { OperationalRelease } from "../domain/operational-release";
import type { OperationalReleaseRepository } from "./ports/operational-release-repository";

export class RegisterOperationalRelease {
  public constructor(
    private readonly releases: OperationalReleaseRepository,
    private readonly ids: IdentifierGenerator,
    private readonly clock: Clock,
  ) {}
  public async execute(
    input: Readonly<{
      version: string;
      reference: string;
      artifactSha: string;
      actorId?: string | null;
    }>,
  ): Promise<OperationalRelease> {
    const reference = input.reference.trim().normalize("NFC");
    const existing = await this.releases.findByReference(reference);
    if (existing !== null) {
      if (
        existing.version === input.version.trim() &&
        existing.artifactSha === input.artifactSha.trim().toLowerCase()
      )
        return existing;
      throw new DomainError(
        "operations.release_reference_taken",
        "The release reference already identifies another artifact.",
      );
    }
    const release = OperationalRelease.register({
      id: this.ids.next().value,
      version: input.version,
      reference,
      artifactSha: input.artifactSha,
      actorId: input.actorId,
      releasedAt: this.clock.now(),
    });
    await this.releases.save(release);
    return release;
  }
}

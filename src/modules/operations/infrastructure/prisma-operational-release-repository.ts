import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { OperationalRelease } from "../domain/operational-release";
import type { OperationalReleaseRepository } from "../application/ports/operational-release-repository";

const toRelease = (row: Readonly<{ id: string; version: string; reference: string; artifactSha: string; actorId: string | null; releasedAt: Date }>): OperationalRelease => OperationalRelease.register(row);

export class PrismaOperationalReleaseRepository implements OperationalReleaseRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async findByReference(reference: string): Promise<OperationalRelease | null> { const row = await this.prisma.operationalRelease.findUnique({ where: { reference } }); return row === null ? null : toRelease(row); }
  public async save(release: OperationalRelease): Promise<void> { await this.prisma.operationalRelease.create({ data: { id: release.id.value, version: release.version, reference: release.reference, artifactSha: release.artifactSha, actorId: release.actorId?.value ?? null, releasedAt: release.releasedAt } }); }
}

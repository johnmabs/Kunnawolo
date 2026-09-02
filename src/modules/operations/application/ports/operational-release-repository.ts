import type { OperationalRelease } from "../../domain/operational-release";

export interface OperationalReleaseRepository {
  findByReference(reference: string): Promise<OperationalRelease | null>;
  save(release: OperationalRelease): Promise<void>;
}

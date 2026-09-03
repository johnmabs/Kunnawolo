import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import type { OperationalRelease } from "../domain/operational-release";
import type { OperationalReleaseRepository } from "./ports/operational-release-repository";
import { RegisterOperationalRelease } from "./register-operational-release";

class Releases implements OperationalReleaseRepository {
  public release: OperationalRelease | null = null;
  public async findByReference(reference: string) {
    return this.release?.reference === reference ? this.release : null;
  }
  public async save(release: OperationalRelease) {
    this.release = release;
  }
}

describe("RegisterOperationalRelease", () => {
  it("records a release once and rejects a reused reference for another artifact", async () => {
    const releases = new Releases();
    const register = new RegisterOperationalRelease(
      releases,
      { next: () => Identifier.fromString("release-id") },
      { now: () => new Date("2026-09-02T12:00:00.000Z") },
    );
    const first = await register.execute({
      version: "1.0.0",
      reference: "REL-ɛ",
      artifactSha: "a".repeat(64),
      actorId: "owner",
    });
    await expect(
      register.execute({
        version: "1.0.0",
        reference: "REL-ɛ",
        artifactSha: "a".repeat(64),
        actorId: "owner",
      }),
    ).resolves.toBe(first);
    await expect(
      register.execute({
        version: "1.0.1",
        reference: "REL-ɛ",
        artifactSha: "b".repeat(64),
      }),
    ).rejects.toMatchObject({ code: "operations.release_reference_taken" });
  });
});

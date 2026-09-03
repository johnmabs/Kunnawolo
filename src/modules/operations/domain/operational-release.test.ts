import { describe, expect, it } from "vitest";
import { OperationalRelease } from "./operational-release";

describe("OperationalRelease", () => {
  it("normalizes a Unicode reference and requires an immutable SHA-256 artifact checksum", () => {
    expect(
      OperationalRelease.register({
        id: "release",
        version: "1.0.0",
        reference: "  Release ɛ  ",
        artifactSha: "a".repeat(64),
        releasedAt: new Date(),
      }),
    ).toMatchObject({ reference: "Release ɛ" });
    expect(() =>
      OperationalRelease.register({
        id: "release",
        version: "1",
        reference: "r",
        artifactSha: "bad",
        releasedAt: new Date(),
      }),
    ).toThrow(
      expect.objectContaining({ code: "operations.invalid_artifact_sha" }),
    );
  });
});

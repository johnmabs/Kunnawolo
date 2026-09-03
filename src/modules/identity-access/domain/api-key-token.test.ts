import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { ApiAccessKey } from "./api-access-key";
import { ApiKeyToken } from "./api-key-token";

describe("API access keys", () => {
  it("validates token structure and normalizes Unicode labels without retaining a plaintext secret", () => {
    expect(() => ApiKeyToken.parse("short.secret")).toThrow(
      expect.objectContaining({ code: "security.invalid_api_key" }),
    );
    const key = ApiAccessKey.issue({
      id: Identifier.fromString("key"),
      organizationId: Identifier.fromString("org"),
      actorId: Identifier.fromString("actor"),
      label: "  Accès ɛɔɲŋ  ",
      secretSalt: "salt",
      secretHash: "hash",
      expiresAt: null,
      createdAt: new Date("2026-09-02T12:00:00.000Z"),
    });
    expect(key).toMatchObject({ label: "Accès ɛɔɲŋ", secretHash: "hash" });
  });
});

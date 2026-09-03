import { describe, expect, it } from "vitest";
import { NodePasswordHasher } from "./node-password-hasher";

describe("NodePasswordHasher", () => {
  it("hashes and verifies a password without storing it", async () => {
    const hasher = new NodePasswordHasher();
    const password = "une phrase secrète suffisamment longue";
    const stored = await hasher.create(password);
    expect(stored.hash).not.toContain(password);
    await expect(hasher.verify(password, stored)).resolves.toBe(true);
    await expect(hasher.verify(`${password}!`, stored)).resolves.toBe(false);
  });
});

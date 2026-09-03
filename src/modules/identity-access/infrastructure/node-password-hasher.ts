import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { PasswordPolicy } from "../domain/password-policy";
import type {
  PasswordHash,
  PasswordHasher,
} from "../application/ports/password-hasher";

const parameters = {
  N: 2 ** 15,
  r: 8,
  p: 3,
  maxmem: 64 * 1024 * 1024,
} as const;
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 32, parameters, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}
export class NodePasswordHasher implements PasswordHasher {
  public async create(password: string): Promise<PasswordHash> {
    PasswordPolicy.validate(password);
    const salt = randomBytes(16).toString("base64url");
    const hash = await derive(password, salt);
    return { algorithm: "scrypt-v1", salt, hash: hash.toString("base64url") };
  }
  public async verify(
    password: string,
    stored: PasswordHash,
  ): Promise<boolean> {
    if (stored.algorithm !== "scrypt-v1" || Array.from(password).length > 128)
      return false;
    const actual = await derive(password, stored.salt);
    const expected = Buffer.from(stored.hash, "base64url");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
  public async consume(password: string): Promise<void> {
    await derive(
      Array.from(password).slice(0, 128).join(""),
      "authentication-timing-salt",
    );
  }
}

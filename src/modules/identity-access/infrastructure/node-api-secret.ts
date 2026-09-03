import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { ApiSecretGenerator } from "../application/ports/api-secret-generator";
import type {
  ApiSecretHash,
  ApiSecretHasher,
} from "../application/ports/api-secret-hasher";

const scryptAsync = promisify(scrypt);

export class NodeApiSecretGenerator implements ApiSecretGenerator {
  public generate(): string {
    return randomBytes(32).toString("base64url");
  }
}

export class NodeApiSecretHasher implements ApiSecretHasher {
  public async create(secret: string): Promise<ApiSecretHash> {
    const salt = randomBytes(16).toString("base64url");
    return {
      salt,
      hash: ((await scryptAsync(secret, salt, 32)) as Buffer).toString(
        "base64url",
      ),
    };
  }

  public async verify(secret: string, stored: ApiSecretHash): Promise<boolean> {
    const actual = (await scryptAsync(secret, stored.salt, 32)) as Buffer;
    const expected = Buffer.from(stored.hash, "base64url");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }
}

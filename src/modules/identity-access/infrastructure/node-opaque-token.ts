import { createHash, randomBytes } from "node:crypto";
import type { OpaqueTokenGenerator, OpaqueTokenHasher } from "../application/ports/opaque-token";
export class NodeOpaqueToken implements OpaqueTokenGenerator, OpaqueTokenHasher {
  public generate() { return randomBytes(32).toString("base64url"); }
  public hash(token: string) { return createHash("sha256").update(token, "utf8").digest("hex"); }
}

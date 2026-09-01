import { Identifier } from "@/shared/domain/identifier";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";

export class UuidIdentifierGenerator implements IdentifierGenerator {
  public next(): Identifier {
    return Identifier.fromString(crypto.randomUUID());
  }
}

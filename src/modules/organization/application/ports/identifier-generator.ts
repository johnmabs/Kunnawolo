import type { Identifier } from "@/shared/domain/identifier";

export interface IdentifierGenerator {
  next(): Identifier;
}

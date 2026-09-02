import { DomainError } from "@/shared/domain/domain-error";

export class WorkspaceIdempotencyKey {
  private constructor(public readonly value: string) {}

  public static fromString(value: string): WorkspaceIdempotencyKey {
    const normalized = value.trim().normalize("NFC");
    if (normalized.length === 0 || normalized.length > 128) throw new DomainError("workspace.invalid_idempotency_key", "An idempotency key must contain between 1 and 128 characters.");
    return new WorkspaceIdempotencyKey(normalized);
  }
}

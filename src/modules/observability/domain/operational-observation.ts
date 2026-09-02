import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export type ObservationMetadata = Readonly<Record<string, string | number | boolean>>;

export class OperationalObservation {
  private constructor(
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier | null,
    public readonly actorId: Identifier | null,
    public readonly action: string,
    public readonly reference: string,
    public readonly correlationId: string,
    public readonly durationMillis: number,
    public readonly metadata: ObservationMetadata,
    public readonly occurredAt: Date,
  ) {}

  public static create(input: Readonly<{ organizationId: string; shopId?: string | null; actorId?: string | null; action: string; reference: string; correlationId: string; durationMillis: number; metadata?: ObservationMetadata; occurredAt: Date }>): OperationalObservation {
    const action = input.action.trim();
    const reference = input.reference.trim().normalize("NFC");
    const correlationId = input.correlationId.trim();
    if (action.length === 0 || reference.length === 0 || correlationId.length === 0) throw new DomainError("observability.invalid_observation", "An observation action, reference, and correlation id are required.");
    if (!Number.isSafeInteger(input.durationMillis) || input.durationMillis < 0) throw new DomainError("observability.invalid_duration", "An observation duration must be a non-negative integer.");
    return new OperationalObservation(Identifier.fromString(input.organizationId), input.shopId === null || input.shopId === undefined ? null : Identifier.fromString(input.shopId), input.actorId === null || input.actorId === undefined ? null : Identifier.fromString(input.actorId), action, reference, correlationId, input.durationMillis, input.metadata ?? {}, input.occurredAt);
  }

  public isSlow(): boolean { return this.durationMillis >= 5000; }
}

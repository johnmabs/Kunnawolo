import type { Clock } from "@/shared/domain/clock";
import {
  OperationalObservation,
  type ObservationMetadata,
} from "../domain/operational-observation";
import type { OperationalLogger } from "./ports/operational-logger";
import type { OperationalObservabilityRepository } from "./ports/operational-observability-repository";

export class ObserveOperation {
  public constructor(
    private readonly repository: OperationalObservabilityRepository,
    private readonly logger: OperationalLogger,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId?: string | null;
      actorId?: string | null;
      action: string;
      reference: string;
      correlationId: string;
      durationMillis: number;
      metadata?: ObservationMetadata;
    }>,
  ): Promise<void> {
    const observation = OperationalObservation.create({
      ...input,
      occurredAt: this.clock.now(),
    });
    await this.repository.record(observation);
    this.logger.info({
      organizationId: observation.organizationId.value,
      shopId: observation.shopId?.value ?? null,
      action: observation.action,
      reference: observation.reference,
      correlationId: observation.correlationId,
      durationMillis: observation.durationMillis,
    });
  }
}

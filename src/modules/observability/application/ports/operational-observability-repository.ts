import type { OperationalObservation } from "../../domain/operational-observation";

export interface OperationalObservabilityRepository {
  record(observation: OperationalObservation): Promise<void>;
}

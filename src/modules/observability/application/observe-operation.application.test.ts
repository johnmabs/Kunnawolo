import { describe, expect, it } from "vitest";
import { ObserveOperation } from "./observe-operation";
import type { OperationalLogger } from "./ports/operational-logger";
import type { OperationalObservabilityRepository } from "./ports/operational-observability-repository";
import type { OperationalObservation } from "../domain/operational-observation";

class Repository implements OperationalObservabilityRepository { public observations: OperationalObservation[] = []; public async record(observation: OperationalObservation) { this.observations.push(observation); } }
class Logger implements OperationalLogger { public events: unknown[] = []; public info(event: Parameters<OperationalLogger["info"]>[0]) { this.events.push(event); } }

describe("ObserveOperation", () => {
  it("records and logs an explainable operation without exposing extra data", async () => {
    const repository = new Repository();
    const logger = new Logger();
    await new ObserveOperation(repository, logger, { now: () => new Date("2026-09-02T12:00:00.000Z") }).execute({ organizationId: "org", shopId: "inactive-shop", actorId: "actor", action: "report.exported", reference: "EXP-ɛ", correlationId: "correlation", durationMillis: 42 });
    expect(repository.observations).toHaveLength(1);
    expect(logger.events).toEqual([expect.objectContaining({ organizationId: "org", reference: "EXP-ɛ", durationMillis: 42 })]);
  });
});

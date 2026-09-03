import { describe, expect, it } from "vitest";
import { OperationalObservation } from "./operational-observation";

describe("OperationalObservation", () => {
  it("normalizes Unicode references and rejects invalid durations", () => {
    const observation = OperationalObservation.create({
      organizationId: "org",
      shopId: "inactive-shop",
      actorId: "actor",
      action: "report.viewed",
      reference: "  Réf ɛɔɲŋ  ",
      correlationId: "correlation",
      durationMillis: 5000,
      occurredAt: new Date(),
    });
    expect(observation).toMatchObject({ reference: "Réf ɛɔɲŋ" });
    expect(observation.isSlow()).toBe(true);
    expect(() =>
      OperationalObservation.create({
        organizationId: "org",
        action: "x",
        reference: "r",
        correlationId: "c",
        durationMillis: -1,
        occurredAt: new Date(),
      }),
    ).toThrow(
      expect.objectContaining({ code: "observability.invalid_duration" }),
    );
  });
});

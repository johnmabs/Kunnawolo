import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { OperationalObservabilityRepository } from "../application/ports/operational-observability-repository";
import type { OperationalObservation } from "../domain/operational-observation";

export class PrismaOperationalObservabilityRepository implements OperationalObservabilityRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async record(observation: OperationalObservation): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (observation.shopId !== null && await tx.shop.count({ where: { id: observation.shopId.value, organizationId: observation.organizationId.value } }) !== 1) {
        throw new DomainError("observability.shop_not_found", "The shop does not belong to this organization.");
      }
      const existing = await tx.organizationAudit.findFirst({ where: { organizationId: observation.organizationId.value, correlationId: observation.correlationId } });
      if (existing !== null) return;
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: observation.organizationId.value, shopId: observation.shopId?.value ?? null, actorId: observation.actorId?.value ?? null, action: observation.action, reference: observation.reference, correlationId: observation.correlationId, metadata: observation.metadata, occurredAt: observation.occurredAt } });
      await tx.operationalMetric.create({ data: { id: crypto.randomUUID(), organizationId: observation.organizationId.value, shopId: observation.shopId?.value ?? null, name: "operation.duration_ms", value: BigInt(observation.durationMillis), correlationId: observation.correlationId, observedAt: observation.occurredAt } });
      if (observation.isSlow()) await tx.operationalAlert.create({ data: { id: crypto.randomUUID(), organizationId: observation.organizationId.value, shopId: observation.shopId?.value ?? null, code: "operation.slow", severity: "WARNING", reference: observation.reference, correlationId: observation.correlationId, details: { durationMillis: observation.durationMillis, action: observation.action }, occurredAt: observation.occurredAt } });
    });
  }
}

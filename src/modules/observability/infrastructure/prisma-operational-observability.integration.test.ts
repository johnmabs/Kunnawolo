import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { OperationalObservation } from "../domain/operational-observation";
import { PrismaOperationalObservabilityRepository } from "./prisma-operational-observability-repository";
import { PrismaOperationalAlertRepository } from "./prisma-operational-alert-repository";
import { OperationalAlertPageQuery } from "../domain/operational-alert-page-query";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error(
    "DATABASE_URL is required for observability integration tests.",
  );
const prisma = createPrismaClient(databaseUrl);
const organizationId = "observability-org";
const otherOrganizationId = "observability-other-org";
const inactiveShopId = "observability-inactive-shop";
const otherShopId = "observability-other-shop";
const at = new Date("2026-09-02T12:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.createMany({
    data: [
      { id: organizationId, name: "Observabilité Ɛ", currency: "XOF" },
      { id: otherOrganizationId, name: "Autre", currency: "XOF" },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.createMany({
    data: [
      {
        id: inactiveShopId,
        organizationId,
        code: "OBS-Ɛ",
        name: "Historique Ɔ",
      },
      {
        id: otherShopId,
        organizationId: otherOrganizationId,
        code: "OBS-Ɛ",
        name: "Autre",
      },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.update({
    where: { id: inactiveShopId },
    data: { isActive: false },
  });
});

afterAll(async () => {
  await prisma.operationalAlert.deleteMany({
    where: { organizationId: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.operationalMetric.deleteMany({
    where: { organizationId: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.organizationAudit.deleteMany({
    where: { organizationId: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.shop.deleteMany({
    where: { id: { in: [inactiveShopId, otherShopId] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.$disconnect();
});

describe("Prisma operational observability", () => {
  it("records an atomic, idempotent audit/metric/alert triplet for an inactive shop without crossing organizations", async () => {
    const repository = new PrismaOperationalObservabilityRepository(prisma);
    const observation = OperationalObservation.create({
      organizationId,
      shopId: inactiveShopId,
      actorId: null,
      action: "report.exported",
      reference: "EXP-ɛ",
      correlationId: "observability-correlation",
      durationMillis: 5000,
      metadata: { format: "CSV", unicode: "ɛɔɲŋ" },
      occurredAt: at,
    });
    await repository.record(observation);
    await repository.record(observation);

    await expect(
      prisma.organizationAudit.findMany({
        where: { organizationId, correlationId: "observability-correlation" },
      }),
    ).resolves.toMatchObject([
      {
        shopId: inactiveShopId,
        reference: "EXP-ɛ",
        metadata: { unicode: "ɛɔɲŋ" },
      },
    ]);
    await expect(
      prisma.operationalMetric.count({
        where: { organizationId, correlationId: "observability-correlation" },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.operationalAlert.findFirst({
        where: { organizationId, code: "operation.slow", reference: "EXP-ɛ" },
      }),
    ).resolves.toMatchObject({ shopId: inactiveShopId, severity: "WARNING" });
    await expect(
      repository.record(
        OperationalObservation.create({
          organizationId,
          shopId: otherShopId,
          action: "report.exported",
          reference: "cross-org",
          correlationId: "cross-org",
          durationMillis: 1,
          occurredAt: at,
        }),
      ),
    ).rejects.toMatchObject({ code: "observability.shop_not_found" });
    await prisma.operationalAlert.createMany({
      data: [
        {
          id: "observability-alert-older",
          organizationId,
          shopId: inactiveShopId,
          code: "operation.retry",
          severity: "WARNING",
          reference: "ALERT-ɛ-1",
          correlationId: "alert-correlation-1",
          occurredAt: new Date("2026-09-01T12:00:00.000Z"),
        },
        {
          id: "observability-alert-newer",
          organizationId,
          shopId: inactiveShopId,
          code: "operation.retry",
          severity: "WARNING",
          reference: "ALERT-ɛ-2",
          correlationId: "alert-correlation-2",
          occurredAt: new Date("2026-09-03T12:00:00.000Z"),
        },
      ],
    });
    const alerts = new PrismaOperationalAlertRepository(prisma);
    const firstPage = await alerts.list(
      OperationalAlertPageQuery.create({
        organizationId,
        shopId: inactiveShopId,
        limit: 2,
      }),
    );
    expect(firstPage.items[0]).toMatchObject({
      id: "observability-alert-newer",
      reference: "ALERT-ɛ-2",
    });
    await expect(
      alerts.list(
        OperationalAlertPageQuery.create({
          organizationId,
          shopId: inactiveShopId,
          limit: 2,
          cursor: firstPage.nextCursor,
        }),
      ),
    ).resolves.toMatchObject({ items: [{ id: "observability-alert-older" }] });
  });
});

import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { DashboardFilter } from "../domain/dashboard-filter";
import { ReportExport } from "../domain/report-export";
import { PrismaReportExportRepository } from "./prisma-report-export-repository";
import { PrismaReportingReadAuthorization } from "./prisma-reporting-read-authorization";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for report-export integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "report-export-org";
const otherOrganizationId = "report-export-other-org";
const shopId = "report-export-inactive-shop";
const otherShopId = "report-export-other-shop";
const ownerId = "report-export-owner";
const managerId = "report-export-manager";
const at = new Date("2026-09-02T12:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.createMany({ data: [{ id: organizationId, name: "Exports Ɛ", currency: "XOF" }, { id: otherOrganizationId, name: "Autres exports", currency: "XOF" }], skipDuplicates: true });
  await prisma.shop.createMany({ data: [{ id: shopId, organizationId, code: "CSV-Ɛ", name: "Historique Ɔ" }, { id: otherShopId, organizationId: otherOrganizationId, code: "CSV-Ɛ", name: "Autre" }], skipDuplicates: true });
  await prisma.userAccount.createMany({ data: [{ id: ownerId, email: "report-export-owner@example.test", displayName: "Owner" }, { id: managerId, email: "report-export-manager@example.test", displayName: "Manager" }], skipDuplicates: true });
  await prisma.organizationMembership.createMany({ data: [{ id: "report-export-owner-membership", organizationId, userAccountId: ownerId, status: "ACTIVE", role: "OWNER", activatedAt: at }, { id: "report-export-manager-membership", organizationId, userAccountId: managerId, status: "ACTIVE", role: "MANAGER", activatedAt: at }], skipDuplicates: true });
  await prisma.shopAssignment.upsert({
    where: { membershipId_shopId: { membershipId: "report-export-manager-membership", shopId } },
    create: { id: "report-export-manager-assignment", membershipId: "report-export-manager-membership", shopId },
    update: {},
  });
  await prisma.shop.update({ where: { id: shopId }, data: { isActive: false } });
});

afterAll(async () => {
  await prisma.reportExport.deleteMany({ where: { organizationId } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.shopAssignment.deleteMany({ where: { id: "report-export-manager-assignment" } });
  await prisma.organizationMembership.deleteMany({ where: { id: { in: ["report-export-owner-membership", "report-export-manager-membership"] } } });
  await prisma.shop.deleteMany({ where: { id: { in: [shopId, otherShopId] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
  await prisma.userAccount.deleteMany({ where: { id: { in: [ownerId, managerId] } } });
  await prisma.$disconnect();
});

describe("report export persistence", () => {
  it("authorizes historical shops, isolates organizations, and records an auditable Unicode CSV export", async () => {
    const authorization = new PrismaReportingReadAuthorization(prisma);
    await expect(authorization.authorize(organizationId, shopId, managerId)).resolves.toBeUndefined();
    await expect(authorization.authorize(organizationId, null, managerId)).rejects.toMatchObject({ code: "reporting.read_forbidden" });
    await expect(authorization.authorize(organizationId, otherShopId, ownerId)).rejects.toMatchObject({ code: "reporting.shop_not_found" });

    const repository = new PrismaReportExportRepository(prisma);
    const reportExport = ReportExport.create({ id: "report-export-id", filter: DashboardFilter.create({ organizationId, shopId, occurredFrom: at, occurredTo: at }), reference: "EXPORT-ɛ", actorId: ownerId, content: '"metric","Historique Ɔ"', exportedAt: at });
    await repository.save(reportExport);

    await expect(repository.findByReference(organizationId, "EXPORT-ɛ")).resolves.toMatchObject({ content: '"metric","Historique Ɔ"', filter: { shopId: { value: shopId } } });
    await expect(repository.findByReference(otherOrganizationId, "EXPORT-ɛ")).resolves.toBeNull();
    await expect(prisma.organizationAudit.findFirst({ where: { organizationId, actorId: ownerId, action: "report_exported:EXPORT-ɛ" } })).resolves.not.toBeNull();
  });
});

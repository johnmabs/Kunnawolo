import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GetWorkspacePreference } from "../application/get-workspace-preference";
import { SaveWorkspacePreference } from "../application/save-workspace-preference";
import { SaveWorkspacePreferenceIdempotently } from "../application/save-workspace-preference-idempotently";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { PrismaWorkspacePreferenceAuthorization } from "./prisma-workspace-preference-authorization";
import { PrismaWorkspacePreferenceRepository } from "./prisma-workspace-preference-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for workspace-preference integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "workspace-org";
const otherOrganizationId = "workspace-other-org";
const inactiveShopId = "workspace-inactive-shop";
const otherShopId = "workspace-other-shop";
const ownerId = "workspace-owner";
const managerId = "workspace-manager";

beforeAll(async () => {
  await prisma.organization.createMany({ data: [{ id: organizationId, name: "Poste Ɛ", currency: "XOF" }, { id: otherOrganizationId, name: "Autre", currency: "XOF" }], skipDuplicates: true });
  await prisma.shop.createMany({ data: [{ id: inactiveShopId, organizationId, code: "UX-Ɛ", name: "Historique Ɔ" }, { id: otherShopId, organizationId: otherOrganizationId, code: "UX-Ɛ", name: "Autre" }], skipDuplicates: true });
  await prisma.userAccount.createMany({ data: [{ id: ownerId, email: "workspace-owner@example.test", displayName: "Owner" }, { id: managerId, email: "workspace-manager@example.test", displayName: "Manager" }], skipDuplicates: true });
  await prisma.organizationMembership.createMany({ data: [{ id: "workspace-owner-membership", organizationId, userAccountId: ownerId, status: "ACTIVE", role: "OWNER", activatedAt: new Date() }, { id: "workspace-manager-membership", organizationId, userAccountId: managerId, status: "ACTIVE", role: "MANAGER", activatedAt: new Date() }], skipDuplicates: true });
  await prisma.shopAssignment.upsert({ where: { membershipId_shopId: { membershipId: "workspace-manager-membership", shopId: inactiveShopId } }, create: { id: "workspace-manager-assignment", membershipId: "workspace-manager-membership", shopId: inactiveShopId }, update: {} });
  await prisma.shop.update({ where: { id: inactiveShopId }, data: { isActive: false } });
});

afterAll(async () => {
  await prisma.workspaceIdempotencyRecord.deleteMany({ where: { organizationId } });
  await prisma.workspacePreference.deleteMany({ where: { organizationId } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.shopAssignment.deleteMany({ where: { id: "workspace-manager-assignment" } });
  await prisma.organizationMembership.deleteMany({ where: { id: { in: ["workspace-owner-membership", "workspace-manager-membership"] } } });
  await prisma.shop.deleteMany({ where: { id: { in: [inactiveShopId, otherShopId] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
  await prisma.userAccount.deleteMany({ where: { id: { in: [ownerId, managerId] } } });
  await prisma.$disconnect();
});

describe("Prisma workspace preferences", () => {
  it("persists an idempotent Unicode historical-shop preference within the authorized organization", async () => {
    const preferences = new PrismaWorkspacePreferenceRepository(prisma);
    const authorization = new PrismaWorkspacePreferenceAuthorization(prisma);
    const save = new SaveWorkspacePreference(preferences, authorization);
    await save.execute({ organizationId, actorId: managerId, shopId: inactiveShopId, isCompact: true });
    await save.execute({ organizationId, actorId: managerId, shopId: inactiveShopId, isCompact: true });

    await expect(new GetWorkspacePreference(preferences, authorization).execute({ organizationId, actorId: managerId })).resolves.toMatchObject({ shopId: { value: inactiveShopId }, isCompact: true });
    await expect(prisma.workspacePreference.count({ where: { organizationId, actorId: managerId } })).resolves.toBe(1);
    await expect(prisma.organizationAudit.count({ where: { organizationId, action: "workspace.preference_saved" } })).resolves.toBe(1);
    await expect(save.execute({ organizationId, actorId: managerId, shopId: otherShopId })).rejects.toMatchObject({ code: "workspace.shop_not_found" });
    await expect(save.execute({ organizationId, actorId: managerId, shopId: null })).rejects.toMatchObject({ code: "workspace.preference_forbidden" });
    const resilientSave = new SaveWorkspacePreferenceIdempotently(preferences, preferences, authorization);
    const first = await resilientSave.execute({ organizationId, actorId: managerId, shopId: inactiveShopId, isCompact: false, idempotencyKey: "poste-ɛ" });
    await expect(resilientSave.execute({ organizationId, actorId: managerId, shopId: inactiveShopId, isCompact: false, idempotencyKey: "poste-ɛ" })).resolves.toMatchObject({ isCompact: false, shopId: { value: inactiveShopId } });
    await expect(resilientSave.execute({ organizationId, actorId: managerId, shopId: inactiveShopId, isCompact: true, idempotencyKey: "poste-ɛ" })).rejects.toMatchObject({ code: "workspace.idempotency_conflict" });
    expect(first.isCompact).toBe(false);
    await expect(prisma.workspaceIdempotencyRecord.count({ where: { organizationId, actorId: managerId } })).resolves.toBe(1);
  });
});

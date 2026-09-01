import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "identity-integration-org";
const accountId = "identity-integration-account";

beforeAll(async () => { await prisma.organization.upsert({ where: { id: organizationId }, create: { id: organizationId, name: "Identity", currency: "XOF" }, update: {} }); await prisma.userAccount.upsert({ where: { id: accountId }, create: { id: accountId, email: "test@example.com", displayName: "Tɛst" }, update: {} }); });
afterAll(async () => { await prisma.organizationMembership.deleteMany({ where: { organizationId } }); await prisma.userAccount.deleteMany({ where: { id: accountId } }); await prisma.organization.deleteMany({ where: { id: organizationId } }); await prisma.$disconnect(); });

describe("OrganizationMembership persistence", () => {
  it("keeps membership separate from the user account", async () => {
    await prisma.organizationMembership.create({ data: { id: "identity-integration-membership", organizationId, userAccountId: accountId, status: "INVITED" } });
    await expect(prisma.organizationMembership.findUnique({ where: { organizationId_userAccountId: { organizationId, userAccountId: accountId } } })).resolves.toMatchObject({ status: "INVITED", userAccountId: accountId });
  });
});

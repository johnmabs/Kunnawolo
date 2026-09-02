import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { AuthenticateApiKey } from "../application/authenticate-api-key";
import { IssueOrganizationApiKey } from "../application/issue-organization-api-key";
import { RevokeOrganizationApiKey } from "../application/revoke-organization-api-key";
import { NodeApiSecretGenerator, NodeApiSecretHasher } from "./node-api-secret";
import { PrismaApiAccessKeyRepository } from "./prisma-api-access-key-repository";
import { PrismaApiKeyAccessAuthorization } from "./prisma-api-key-access-authorization";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for API-key integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "security-api-key-org";
const otherOrganizationId = "security-api-key-other-org";
const ownerId = "security-api-key-owner";
const inactiveShopId = "security-api-key-inactive-shop";
const otherShopId = "security-api-key-other-shop";

beforeAll(async () => {
  await prisma.organization.createMany({ data: [{ id: organizationId, name: "Sécurité Ɛ", currency: "XOF" }, { id: otherOrganizationId, name: "Autre", currency: "XOF" }], skipDuplicates: true });
  await prisma.shop.createMany({ data: [{ id: inactiveShopId, organizationId, code: "SEC-Ɛ", name: "Historique Ɔ" }, { id: otherShopId, organizationId: otherOrganizationId, code: "SEC-Ɛ", name: "Autre" }], skipDuplicates: true });
  await prisma.userAccount.upsert({ where: { id: ownerId }, create: { id: ownerId, email: "security-api-key-owner@example.test", displayName: "Owner" }, update: {} });
  await prisma.organizationMembership.upsert({ where: { organizationId_userAccountId: { organizationId, userAccountId: ownerId } }, create: { id: "security-api-key-membership", organizationId, userAccountId: ownerId, status: "ACTIVE", role: "OWNER", activatedAt: new Date() }, update: { status: "ACTIVE", role: "OWNER" } });
  await prisma.shop.update({ where: { id: inactiveShopId }, data: { isActive: false } });
});

afterAll(async () => {
  await prisma.apiAccessKey.deleteMany({ where: { organizationId } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.organizationMembership.deleteMany({ where: { organizationId } });
  await prisma.shop.deleteMany({ where: { id: { in: [inactiveShopId, otherShopId] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
  await prisma.userAccount.deleteMany({ where: { id: ownerId } });
  await prisma.$disconnect();
});

describe("Prisma API access keys", () => {
  it("stores only a hash, scopes access to its organization, preserves inactive-shop history, and audits issuance/revocation", async () => {
    const repository = new PrismaApiAccessKeyRepository(prisma);
    const authorization = new PrismaApiKeyAccessAuthorization(prisma);
    const hasher = new NodeApiSecretHasher();
    const issue = new IssueOrganizationApiKey(repository, authorization, new UuidIdentifierGenerator(), new NodeApiSecretGenerator(), hasher, new SystemClock());
    const issued = await issue.execute({ organizationId, actorId: ownerId, label: "Intégration ɛɔɲŋ" });
    const row = await prisma.apiAccessKey.findUnique({ where: { id: issued.key.id.value } });

    expect(row).toMatchObject({ organizationId, actorId: ownerId, label: "Intégration ɛɔɲŋ" });
    expect(row?.secretHash).not.toContain(issued.token.split(".")[1] ?? "");
    await expect(new AuthenticateApiKey(repository, authorization, hasher, new SystemClock()).execute(issued.token)).resolves.toEqual({ organizationId, actorId: ownerId });
    await new RevokeOrganizationApiKey(repository, authorization, new SystemClock()).execute({ organizationId, actorId: ownerId, keyId: issued.key.id.value });
    await expect(new AuthenticateApiKey(repository, authorization, hasher, new SystemClock()).execute(issued.token)).rejects.toMatchObject({ code: "security.invalid_api_key" });
    await expect(prisma.organizationAudit.count({ where: { organizationId, action: { startsWith: "api_key." } } })).resolves.toBe(2);
  });
});

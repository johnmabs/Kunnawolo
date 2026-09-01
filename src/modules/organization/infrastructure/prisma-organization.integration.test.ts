import "dotenv/config";

import { afterAll, describe, expect, it } from "vitest";

import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";

import { CreateOrganization } from "../application/create-organization";
import type { IdentifierGenerator } from "../application/ports/identifier-generator";
import { PrismaAuditLog } from "./prisma-audit-log";
import { PrismaOrganizationRepository } from "./prisma-organization-repository";

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined) {
  throw new Error("DATABASE_URL is required for organization integration tests.");
}

const organizationId = "organization-integration-test";
const prisma = createPrismaClient(databaseUrl);

const identifiers: IdentifierGenerator = {
  next: () => Identifier.fromString(organizationId),
};

afterAll(async () => {
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.$disconnect();
});

describe("PrismaOrganizationRepository", () => {
  it("persists normalized Unicode data and its creation audit", async () => {
    const organizations = new PrismaOrganizationRepository(prisma);
    const createOrganization = new CreateOrganization(organizations, new PrismaAuditLog(prisma), identifiers);

    await createOrganization.execute({ name: "  Kɔ̀rɔfɛ  ", currency: "XOF" }, "actor-1");

    expect((await organizations.findById(organizationId))?.name).toBe("Kɔ̀rɔfɛ".normalize("NFC"));
    await expect(prisma.organizationAudit.findFirst({ where: { organizationId, action: "organization.created" } })).resolves.toMatchObject({
      actorId: "actor-1",
    });
  });
});

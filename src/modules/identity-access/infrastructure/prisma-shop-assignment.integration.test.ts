import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { PrismaShopAssignmentRepository } from "./prisma-shop-assignment-repository";

const url = process.env.DATABASE_URL;
if (url === undefined) throw new Error("DATABASE_URL is required.");
const prisma = createPrismaClient(url);
const organizationId = "assignment-test-org";
const accountId = "assignment-test-account";
const membershipId = "assignment-test-membership";
const shopId = "assignment-test-shop";

beforeAll(async () => {
  await prisma.organization.create({
    data: {
      id: organizationId,
      name: "Assignment",
      currency: "XOF",
      shops: { create: { id: shopId, code: "ASSIGN", name: "Sɔgɔma" } },
      memberships: {
        create: {
          id: membershipId,
          status: "ACTIVE",
          role: "MANAGER",
          userAccount: {
            create: {
              id: accountId,
              email: "assignment@example.com",
              displayName: "Test",
            },
          },
        },
      },
    },
  });
});
afterAll(async () => {
  await prisma.shopAssignment.deleteMany({ where: { membershipId } });
  await prisma.organizationMembership.deleteMany({
    where: { id: membershipId },
  });
  await prisma.shop.deleteMany({ where: { id: shopId } });
  await prisma.userAccount.deleteMany({ where: { id: accountId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.$disconnect();
});

describe("PrismaShopAssignmentRepository", () => {
  it("stores idempotent shop assignments", async () => {
    const assignments = new PrismaShopAssignmentRepository(prisma);
    await assignments.assign({
      id: "assignment-test-id",
      membershipId,
      shopId,
    });
    await assignments.assign({
      id: "assignment-test-id-2",
      membershipId,
      shopId,
    });
    await expect(
      assignments.findShopIdsForMembership(membershipId),
    ).resolves.toEqual([shopId]);
  });
});

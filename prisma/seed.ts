import { createPrismaClient } from "../src/infrastructure/prisma/prisma-client";
import { NodePasswordHasher } from "../src/modules/identity-access/infrastructure/node-password-hasher";

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined) {
  throw new Error("DATABASE_URL is required to run the database seed.");
}

if (process.env.DEMO_SEED_ENABLED !== "true") {
  console.log("Demo seed skipped. Set DEMO_SEED_ENABLED=true to create the demonstration workspace.");
  process.exit(0);
}

const demoPassword = process.env.DEMO_PASSWORD;
if (demoPassword === undefined) {
  throw new Error("DEMO_PASSWORD is required when DEMO_SEED_ENABLED=true.");
}

const organizationId = "00000000-0000-4000-8000-000000000001";
const centreVilleId = "00000000-0000-4000-8000-000000000101";
const tieTieId = "00000000-0000-4000-8000-000000000102";

const accounts = [
  { id: "00000000-0000-4000-8000-000000000201", email: "owner@demo.local", displayName: "Aminata Owner", role: "OWNER", membershipId: "00000000-0000-4000-8000-000000000301", shopIds: [centreVilleId, tieTieId] },
  { id: "00000000-0000-4000-8000-000000000202", email: "manager@demo.local", displayName: "Moussa Manager", role: "MANAGER", membershipId: "00000000-0000-4000-8000-000000000302", shopIds: [centreVilleId, tieTieId] },
  { id: "00000000-0000-4000-8000-000000000203", email: "cashier@demo.local", displayName: "Fatou Caissière", role: "CASHIER", membershipId: "00000000-0000-4000-8000-000000000303", shopIds: [centreVilleId] },
] as const;

const prisma = createPrismaClient(databaseUrl);

try {
  await prisma.$connect();
  const passwordHasher = new NodePasswordHasher();
  const credentials = new Map<string, Awaited<ReturnType<NodePasswordHasher["create"]>>>();
  for (const account of accounts) credentials.set(account.email, await passwordHasher.create(demoPassword));

  await prisma.$transaction(async (transaction) => {
    await transaction.organization.upsert({
      where: { id: organizationId },
      create: { id: organizationId, name: "ASTU Démo", currency: "XOF" },
      update: { name: "ASTU Démo", currency: "XOF" },
    });
    await transaction.shop.upsert({
      where: { id: centreVilleId },
      create: { id: centreVilleId, organizationId, code: "CENTRE", name: "Centre-ville" },
      update: { code: "CENTRE", name: "Centre-ville", isActive: true },
    });
    await transaction.shop.upsert({
      where: { id: tieTieId },
      create: { id: tieTieId, organizationId, code: "TIE-TIE", name: "Tié-Tié" },
      update: { code: "TIE-TIE", name: "Tié-Tié", isActive: true },
    });

    for (const [accountIndex, account] of accounts.entries()) {
      const user = await transaction.userAccount.upsert({
        where: { email: account.email },
        create: { id: account.id, email: account.email, displayName: account.displayName },
        update: { displayName: account.displayName },
      });
      const credential = credentials.get(account.email);
      if (credential === undefined) throw new Error(`Missing generated credential for ${account.email}.`);
      await transaction.passwordCredential.upsert({
        where: { userAccountId: user.id },
        create: { userAccountId: user.id, ...credential },
        update: credential,
      });
      const membership = await transaction.organizationMembership.upsert({
        where: { organizationId_userAccountId: { organizationId, userAccountId: user.id } },
        create: { id: account.membershipId, organizationId, userAccountId: user.id, status: "ACTIVE", role: account.role, activatedAt: new Date() },
        update: { status: "ACTIVE", role: account.role, activatedAt: new Date(), deactivatedAt: null },
      });
      for (const [shopIndex, shopId] of account.shopIds.entries()) {
        await transaction.shopAssignment.upsert({
          where: { membershipId_shopId: { membershipId: membership.id, shopId } },
          create: { id: `00000000-0000-4000-8000-${String(400 + accountIndex * 10 + shopIndex + 1).padStart(12, "0")}`, membershipId: membership.id, shopId },
          update: {},
        });
      }
      await transaction.workspacePreference.upsert({
        where: { organizationId_actorId: { organizationId, actorId: user.id } },
        create: { id: `00000000-0000-4000-8000-${String(501 + accountIndex).padStart(12, "0")}`, organizationId, actorId: user.id, shopId: centreVilleId, isCompact: false },
        update: { shopId: centreVilleId },
      });
    }
  });
  console.log("Demo workspace ready: ASTU Démo with owner, manager and cashier accounts.");
} finally {
  await prisma.$disconnect();
}

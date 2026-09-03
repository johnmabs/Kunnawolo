import "dotenv/config";
import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { MembershipInvitation } from "../domain/membership-invitation";
import { OrganizationMembership } from "../domain/organization-membership";
import { UserAccount } from "../domain/user-account";
import { PrismaMembershipInvitationRepository } from "./prisma-membership-invitation-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for invitation integration tests.");
const prisma = createPrismaClient(databaseUrl);
const suffix = crypto.randomUUID();
const organizationId = `invitation-outbox-org-${suffix}`;
const ownerId = `invitation-outbox-owner-${suffix}`;
const tokenHash = (label: string) => createHash("sha256").update(`${label}-${suffix}`).digest("hex");

function aggregate(label: string, deliveryId: string) {
  const account = UserAccount.create(Identifier.fromString(`account-${label}-${suffix}`), `${label}-${suffix}@example.test`, `Compte ${label}`);
  const membership = OrganizationMembership.invite(Identifier.fromString(`membership-${label}-${suffix}`), Identifier.fromString(organizationId), account.id);
  const invitation = MembershipInvitation.issue({ id: Identifier.fromString(`invitation-${label}-${suffix}`), organizationId: Identifier.fromString(organizationId), membershipId: membership.id, invitedByActorId: Identifier.fromString(ownerId), email: account.email, tokenHash: tokenHash(label), issuedAt: new Date("2026-09-03T10:00:00.000Z"), expiresAt: new Date("2026-09-05T10:00:00.000Z") });
  return { account, membership, invitation, delivery: { id: deliveryId, invitationId: invitation.id.value, email: account.email, displayName: account.displayName, organizationName: "Outbox", acceptanceUrl: `https://example.test/invitations/${label}`, expiresAt: invitation.expiresAt } };
}

describe("PrismaMembershipInvitationRepository outbox", () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.organization.create({ data: { id: organizationId, name: "Outbox", currency: "XOF" } });
    await prisma.userAccount.create({ data: { id: ownerId, email: `owner-${suffix}@example.test`, displayName: "Owner" } });
    await prisma.organizationMembership.create({ data: { id: `owner-membership-${suffix}`, organizationId, userAccountId: ownerId, status: "ACTIVE", role: "OWNER", activatedAt: new Date() } });
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it("commits the invitation and delivery atomically", async () => {
    const repository = new PrismaMembershipInvitationRepository(prisma);
    const deliveryId = `delivery-${suffix}`;
    const first = aggregate("first", deliveryId);
    await repository.create({ ...first, createAccount: true });
    await expect(prisma.invitationDeliveryOutbox.findUnique({ where: { id: deliveryId } })).resolves.toMatchObject({ invitationId: first.invitation.id.value, status: "PENDING", attemptCount: 0 });

    const second = aggregate("second", deliveryId);
    await expect(repository.create({ ...second, createAccount: true })).rejects.toBeDefined();
    await expect(prisma.userAccount.findUnique({ where: { id: second.account.id.value } })).resolves.toBeNull();
    await expect(prisma.organizationMembership.findUnique({ where: { id: second.membership.id.value } })).resolves.toBeNull();
    await expect(prisma.membershipInvitation.findUnique({ where: { id: second.invitation.id.value } })).resolves.toBeNull();
  });

  it("invalidates the previous token and pending delivery when reissued", async () => {
    const repository = new PrismaMembershipInvitationRepository(prisma);
    const initial = aggregate("resend", `delivery-resend-old-${suffix}`);
    await repository.create({ ...initial, createAccount: true });
    const expiresAt = new Date("2026-09-06T10:00:00.000Z");
    const replacementHash = tokenHash("replacement");
    const invitation = MembershipInvitation.issue({ id: initial.invitation.id, organizationId: initial.invitation.organizationId, membershipId: initial.invitation.membershipId, invitedByActorId: initial.invitation.invitedByActorId, email: initial.invitation.email, tokenHash: replacementHash, issuedAt: new Date("2026-09-04T10:00:00.000Z"), expiresAt });
    const delivery = { ...initial.delivery, id: `delivery-resend-new-${suffix}`, acceptanceUrl: "https://example.test/invitations/replacement", expiresAt };
    await repository.reissue({ invitation, delivery });
    await expect(prisma.membershipInvitation.findUnique({ where: { id: invitation.id.value } })).resolves.toMatchObject({ tokenHash: replacementHash, expiresAt });
    await expect(prisma.invitationDeliveryOutbox.findUnique({ where: { id: initial.delivery.id } })).resolves.toMatchObject({ status: "CANCELLED", acceptanceUrl: null });
    await expect(prisma.invitationDeliveryOutbox.findUnique({ where: { id: delivery.id } })).resolves.toMatchObject({ status: "PENDING", acceptanceUrl: delivery.acceptanceUrl });
  });
});

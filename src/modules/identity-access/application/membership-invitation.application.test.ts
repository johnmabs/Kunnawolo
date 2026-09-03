import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { UserAccount } from "../domain/user-account";
import type { PasswordHash, PasswordHasher } from "./ports/password-hasher";
import type { InvitationDetails, MembershipInvitationRepository } from "./ports/membership-invitation-repository";
import { InviteMember } from "./invite-member";
import { AcceptMembershipInvitation } from "./accept-membership-invitation";

class Invitations implements MembershipInvitationRepository {
  public account: UserAccount | null = null;
  public details: InvitationDetails | null = null;
  public accepted: Parameters<MembershipInvitationRepository["accept"]>[0] | null = null;
  public async authorizeInvitation() {}
  public async findAccountByEmail() { return this.account; }
  public async create(input: Parameters<MembershipInvitationRepository["create"]>[0]) { this.account = input.account; this.details = { account: input.account, hasCredential: !input.createAccount, invitation: input.invitation, membership: input.membership, organizationName: "ASTU SARL" }; }
  public async findByTokenHash() { return this.details; }
  public async accept(input: Parameters<MembershipInvitationRepository["accept"]>[0]) { this.accepted = input; }
}
class Passwords implements PasswordHasher {
  public async create(password: string): Promise<PasswordHash> { return { algorithm: "test", salt: "salt", hash: password }; }
  public async verify() { return true; }
  public async consume() {}
}

describe("membership invitations", () => {
  const ids = { next: () => Identifier.fromString(crypto.randomUUID()) };
  const opaque = { generate: () => "temporary-token", hash: () => "a".repeat(64) };
  const clock = { now: () => new Date("2026-09-03T08:00:00.000Z") };
  const delivery = { send: async () => undefined };

  it("creates a 48-hour one-use invitation for a new account", async () => {
    const repository = new Invitations();
    const issued = await new InviteMember(repository, delivery, ids, opaque, opaque, clock, "https://sales.example").execute({ organizationId: "org", invitedByActorId: "owner", email: " User@example.com ", displayName: "User", organizationName: "ASTU SARL" });
    expect(issued.acceptanceUrl).toContain("/invitations/temporary-token");
    expect(issued.invitation.expiresAt.toISOString()).toBe("2026-09-05T08:00:00.000Z");
  });

  it("sets a password and activates a new invited account", async () => {
    const repository = new Invitations();
    await new InviteMember(repository, delivery, ids, opaque, opaque, clock, "https://sales.example").execute({ organizationId: "org", invitedByActorId: "owner", email: "user@example.com", displayName: "User", organizationName: "ASTU SARL" });
    const result = await new AcceptMembershipInvitation(repository, opaque, new Passwords(), clock).execute({ token: "temporary-token", password: "phrase secrète très longue", authenticatedUserAccountId: null });
    expect(result.shouldIssueSession).toBe(true);
    expect(repository.accepted).toMatchObject({ membership: { status: "ACTIVE" }, credential: { algorithm: "test" } });
  });

  it("requires the invited identity to be signed in for an existing account", async () => {
    const repository = new Invitations();
    repository.account = UserAccount.create(ids.next(), "user@example.com", "User");
    await new InviteMember(repository, delivery, ids, opaque, opaque, clock, "https://sales.example").execute({ organizationId: "org", invitedByActorId: "owner", email: "user@example.com", displayName: "Ignored", organizationName: "ASTU SARL" });
    await expect(new AcceptMembershipInvitation(repository, opaque, new Passwords(), clock).execute({ token: "temporary-token", password: null, authenticatedUserAccountId: "someone-else" })).rejects.toMatchObject({ code: "auth.invitation_login_required" });
  });
});

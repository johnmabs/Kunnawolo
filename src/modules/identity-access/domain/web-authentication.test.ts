import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { PasswordPolicy } from "./password-policy";
import { WebSession } from "./web-session";
import { MembershipInvitation } from "./membership-invitation";

const id = (value: string) => Identifier.fromString(value);
const hash = "a".repeat(64);
describe("web authentication domain", () => {
  it("accepts long unicode passphrases without normalization", () => { const password = " phrase secrète 🔐 très longue "; expect(PasswordPolicy.validate(password)).toBe(password); expect(() => PasswordPolicy.validate("trop court")).toThrow(expect.objectContaining({ code: "auth.password_too_short" })); });
  it("expires and revokes sessions", () => { const now = new Date("2026-09-02T10:00:00Z"); const session = WebSession.issue({ id: id("session"), userAccountId: id("user"), tokenHash: hash, issuedAt: now, expiresAt: new Date("2026-09-09T10:00:00Z") }); expect(session.isActive(now)).toBe(true); expect(session.revoke(now).isActive(now)).toBe(false); });
  it("accepts an invitation only once before expiry", () => { const now = new Date("2026-09-02T10:00:00Z"); const invitation = MembershipInvitation.issue({ id: id("invitation"), organizationId: id("org"), membershipId: id("member"), invitedByActorId: id("owner"), email: " User@Example.com ", tokenHash: hash, issuedAt: now, expiresAt: new Date("2026-09-04T10:00:00Z") }); expect(invitation.email).toBe("user@example.com"); expect(() => invitation.accept(now).accept(now)).toThrow(expect.objectContaining({ code: "auth.invitation_already_accepted" })); });
});

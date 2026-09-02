CREATE TABLE "PasswordCredential" (
    "userAccountId" TEXT NOT NULL,
    "algorithm" VARCHAR(32) NOT NULL,
    "salt" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PasswordCredential_pkey" PRIMARY KEY ("userAccountId")
);

CREATE TABLE "WebSession" (
    "id" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MembershipInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "invitedByActorId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MembershipInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebSession_tokenHash_key" ON "WebSession"("tokenHash");
CREATE INDEX "WebSession_userAccountId_expiresAt_idx" ON "WebSession"("userAccountId", "expiresAt");
CREATE UNIQUE INDEX "MembershipInvitation_membershipId_key" ON "MembershipInvitation"("membershipId");
CREATE UNIQUE INDEX "MembershipInvitation_tokenHash_key" ON "MembershipInvitation"("tokenHash");
CREATE INDEX "MembershipInvitation_organizationId_email_idx" ON "MembershipInvitation"("organizationId", "email");
CREATE INDEX "MembershipInvitation_expiresAt_idx" ON "MembershipInvitation"("expiresAt");

ALTER TABLE "PasswordCredential" ADD CONSTRAINT "PasswordCredential_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebSession" ADD CONSTRAINT "WebSession_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembershipInvitation" ADD CONSTRAINT "MembershipInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MembershipInvitation" ADD CONSTRAINT "MembershipInvitation_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "OrganizationMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembershipInvitation" ADD CONSTRAINT "MembershipInvitation_invitedByActorId_fkey" FOREIGN KEY ("invitedByActorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

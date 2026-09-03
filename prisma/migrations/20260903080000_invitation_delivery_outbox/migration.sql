CREATE TABLE "InvitationDeliveryOutbox" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "acceptanceUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastErrorCode" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvitationDeliveryOutbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvitationDeliveryOutbox_status_nextAttemptAt_idx" ON "InvitationDeliveryOutbox"("status", "nextAttemptAt");
CREATE INDEX "InvitationDeliveryOutbox_invitationId_createdAt_idx" ON "InvitationDeliveryOutbox"("invitationId", "createdAt");

ALTER TABLE "InvitationDeliveryOutbox" ADD CONSTRAINT "InvitationDeliveryOutbox_invitationId_fkey"
  FOREIGN KEY ("invitationId") REFERENCES "MembershipInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

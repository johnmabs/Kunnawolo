CREATE TABLE "ApiAccessKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "secretSalt" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiAccessKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiAccessKey_organizationId_label_key" ON "ApiAccessKey"("organizationId", "label");
CREATE INDEX "ApiAccessKey_organizationId_actorId_idx" ON "ApiAccessKey"("organizationId", "actorId");

ALTER TABLE "ApiAccessKey" ADD CONSTRAINT "ApiAccessKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApiAccessKey" ADD CONSTRAINT "ApiAccessKey_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

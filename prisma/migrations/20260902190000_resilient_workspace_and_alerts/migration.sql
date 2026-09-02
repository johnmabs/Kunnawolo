CREATE TABLE "WorkspaceIdempotencyRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "shopId" TEXT,
    "isCompact" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceIdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceIdempotencyRecord_organizationId_actorId_key_key" ON "WorkspaceIdempotencyRecord"("organizationId", "actorId", "key");
CREATE INDEX "WorkspaceIdempotencyRecord_organizationId_createdAt_idx" ON "WorkspaceIdempotencyRecord"("organizationId", "createdAt");
ALTER TABLE "WorkspaceIdempotencyRecord" ADD CONSTRAINT "WorkspaceIdempotencyRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspaceIdempotencyRecord" ADD CONSTRAINT "WorkspaceIdempotencyRecord_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "OperationalAlert_organizationId_shopId_occurredAt_id_idx" ON "OperationalAlert"("organizationId", "shopId", "occurredAt", "id");

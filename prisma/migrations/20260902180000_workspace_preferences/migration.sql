CREATE TABLE "WorkspacePreference" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "shopId" TEXT,
    "isCompact" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspacePreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspacePreference_organizationId_actorId_key" ON "WorkspacePreference"("organizationId", "actorId");
CREATE INDEX "WorkspacePreference_organizationId_shopId_idx" ON "WorkspacePreference"("organizationId", "shopId");
ALTER TABLE "WorkspacePreference" ADD CONSTRAINT "WorkspacePreference_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspacePreference" ADD CONSTRAINT "WorkspacePreference_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspacePreference" ADD CONSTRAINT "WorkspacePreference_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

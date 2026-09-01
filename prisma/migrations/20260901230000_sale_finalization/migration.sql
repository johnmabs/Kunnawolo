ALTER TABLE "SaleCart"
  ADD COLUMN "finalizationReference" TEXT,
  ADD COLUMN "finalizedByActorId" TEXT,
  ADD COLUMN "finalizedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "SaleCart_organizationId_finalizationReference_key"
  ON "SaleCart"("organizationId", "finalizationReference");

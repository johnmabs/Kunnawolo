ALTER TABLE "StockMovement" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "StockMovement_organizationId_idempotencyKey_key" ON "StockMovement"("organizationId", "idempotencyKey");

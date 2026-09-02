ALTER TABLE "StockTransfer" ADD COLUMN "cancellationReference" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "cancelledByActorId" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "cancelledAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "StockTransfer_organizationId_cancellationReference_key" ON "StockTransfer"("organizationId", "cancellationReference");

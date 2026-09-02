ALTER TABLE "StockTransfer" ADD COLUMN "receptionReference" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "receivedByActorId" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "receivedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "StockTransfer_organizationId_receptionReference_key" ON "StockTransfer"("organizationId", "receptionReference");

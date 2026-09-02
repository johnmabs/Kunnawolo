ALTER TABLE "StockTransfer" ADD COLUMN "shipmentReference" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "sentByActorId" TEXT;
ALTER TABLE "StockTransfer" ADD COLUMN "sentAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "StockTransfer_organizationId_shipmentReference_key" ON "StockTransfer"("organizationId", "shipmentReference");

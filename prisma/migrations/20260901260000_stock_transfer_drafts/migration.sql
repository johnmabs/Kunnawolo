CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceShopId" TEXT NOT NULL,
    "destinationShopId" TEXT NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    "createdByActorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockTransferLine" (
    "id" TEXT NOT NULL,
    "stockTransferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,
    CONSTRAINT "StockTransferLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StockTransfer_organizationId_sourceShopId_status_idx" ON "StockTransfer"("organizationId", "sourceShopId", "status");
CREATE INDEX "StockTransfer_organizationId_destinationShopId_status_idx" ON "StockTransfer"("organizationId", "destinationShopId", "status");
CREATE UNIQUE INDEX "StockTransferLine_stockTransferId_productId_key" ON "StockTransferLine"("stockTransferId", "productId");
CREATE INDEX "StockTransferLine_productId_idx" ON "StockTransferLine"("productId");

ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_sourceShopId_fkey" FOREIGN KEY ("sourceShopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_destinationShopId_fkey" FOREIGN KEY ("destinationShopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_stockTransferId_fkey" FOREIGN KEY ("stockTransferId") REFERENCES "StockTransfer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

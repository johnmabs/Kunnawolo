ALTER TABLE "SaleCart" ADD COLUMN "underCostReason" TEXT;

CREATE TABLE "SaleCancellation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "saleCartId" TEXT NOT NULL,
    "cancellationReference" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleCancellation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SaleCancellation_saleCartId_key" ON "SaleCancellation"("saleCartId");
CREATE UNIQUE INDEX "SaleCancellation_organizationId_cancellationReference_key" ON "SaleCancellation"("organizationId", "cancellationReference");
ALTER TABLE "SaleCancellation" ADD CONSTRAINT "SaleCancellation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleCancellation" ADD CONSTRAINT "SaleCancellation_saleCartId_fkey" FOREIGN KEY ("saleCartId") REFERENCES "SaleCart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

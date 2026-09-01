ALTER TABLE "SaleCart" ADD COLUMN "businessReference" TEXT;
CREATE UNIQUE INDEX "SaleCart_organizationId_businessReference_key" ON "SaleCart"("organizationId", "businessReference");

CREATE TABLE "SalePayment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "saleCartId" TEXT NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "method" VARCHAR(32) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "actorId" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalePayment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SalePayment_saleCartId_key" ON "SalePayment"("saleCartId");
CREATE UNIQUE INDEX "SalePayment_organizationId_paymentReference_key" ON "SalePayment"("organizationId", "paymentReference");
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalePayment" ADD CONSTRAINT "SalePayment_saleCartId_fkey" FOREIGN KEY ("saleCartId") REFERENCES "SaleCart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SalesSequence" (
    "organizationId" TEXT NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "SalesSequence_pkey" PRIMARY KEY ("organizationId")
);
ALTER TABLE "SalesSequence" ADD CONSTRAINT "SalesSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Instantanés immuables de coût de référence et prix de vente.
CREATE TABLE "ProductPrice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "referenceCostMinor" BIGINT NOT NULL,
    "salePriceMinor" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductPrice_organizationId_productId_createdAt_idx" ON "ProductPrice"("organizationId", "productId", "createdAt");

ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

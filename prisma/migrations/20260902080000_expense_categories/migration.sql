CREATE TABLE "ExpenseCategory" ("id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "name" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "ExpenseCategory_organizationId_name_key" ON "ExpenseCategory"("organizationId", "name");
CREATE INDEX "ExpenseCategory_organizationId_isActive_idx" ON "ExpenseCategory"("organizationId", "isActive");
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

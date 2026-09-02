ALTER TABLE "OrganizationAudit" ADD COLUMN "reference" TEXT;
ALTER TABLE "OrganizationAudit" ADD COLUMN "correlationId" TEXT;
ALTER TABLE "OrganizationAudit" ADD COLUMN "shopId" TEXT;
ALTER TABLE "OrganizationAudit" ADD COLUMN "metadata" JSONB;

CREATE INDEX "OrganizationAudit_organizationId_shopId_occurredAt_idx" ON "OrganizationAudit"("organizationId", "shopId", "occurredAt");
CREATE INDEX "OrganizationAudit_organizationId_reference_idx" ON "OrganizationAudit"("organizationId", "reference");
CREATE UNIQUE INDEX "OrganizationAudit_organizationId_correlationId_key" ON "OrganizationAudit"("organizationId", "correlationId");

ALTER TABLE "OrganizationAudit" ADD CONSTRAINT "OrganizationAudit_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OperationalMetric" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shopId" TEXT,
    "name" VARCHAR(64) NOT NULL,
    "value" BIGINT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalMetric_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalMetric_organizationId_name_observedAt_idx" ON "OperationalMetric"("organizationId", "name", "observedAt");
CREATE INDEX "OperationalMetric_organizationId_shopId_observedAt_idx" ON "OperationalMetric"("organizationId", "shopId", "observedAt");
ALTER TABLE "OperationalMetric" ADD CONSTRAINT "OperationalMetric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalMetric" ADD CONSTRAINT "OperationalMetric_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OperationalAlert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shopId" TEXT,
    "code" VARCHAR(64) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "reference" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "details" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalAlert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalAlert_organizationId_code_reference_key" ON "OperationalAlert"("organizationId", "code", "reference");
CREATE INDEX "OperationalAlert_organizationId_shopId_occurredAt_idx" ON "OperationalAlert"("organizationId", "shopId", "occurredAt");
ALTER TABLE "OperationalAlert" ADD CONSTRAINT "OperationalAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalAlert" ADD CONSTRAINT "OperationalAlert_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

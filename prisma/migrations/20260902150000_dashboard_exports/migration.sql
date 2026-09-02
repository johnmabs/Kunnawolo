CREATE TABLE "ReportExport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shopId" TEXT,
    "format" VARCHAR(16) NOT NULL,
    "reference" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "occurredFrom" TIMESTAMP(3),
    "occurredTo" TIMESTAMP(3),
    "content" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportExport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReportExport_organizationId_reference_key" ON "ReportExport"("organizationId", "reference");
CREATE INDEX "ReportExport_organizationId_shopId_exportedAt_idx" ON "ReportExport"("organizationId", "shopId", "exportedAt");

ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReportExport" ADD CONSTRAINT "ReportExport_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

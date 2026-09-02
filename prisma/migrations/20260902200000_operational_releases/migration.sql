CREATE TABLE "OperationalRelease" (
    "id" TEXT NOT NULL,
    "version" VARCHAR(64) NOT NULL,
    "reference" TEXT NOT NULL,
    "artifactSha" VARCHAR(128) NOT NULL,
    "actorId" TEXT,
    "releasedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalRelease_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalRelease_reference_key" ON "OperationalRelease"("reference");
CREATE INDEX "OperationalRelease_releasedAt_idx" ON "OperationalRelease"("releasedAt");

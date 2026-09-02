CREATE TABLE "ExpenseCancellation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "cancellationReference" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseCancellation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpenseCancellation_expenseId_key" ON "ExpenseCancellation"("expenseId");
CREATE UNIQUE INDEX "ExpenseCancellation_organizationId_cancellationReference_key" ON "ExpenseCancellation"("organizationId", "cancellationReference");
CREATE INDEX "ExpenseCancellation_organizationId_cancelledAt_idx" ON "ExpenseCancellation"("organizationId", "cancelledAt");

ALTER TABLE "ExpenseCancellation" ADD CONSTRAINT "ExpenseCancellation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseCancellation" ADD CONSTRAINT "ExpenseCancellation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

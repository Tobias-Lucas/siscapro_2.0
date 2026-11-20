-- Additive V3.3 migration; all existing operational and staging records are preserved.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'APPRENTICE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CANDIDATE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'LEGAL_GUARDIAN';
ALTER TABLE "Demand" ADD COLUMN "originChannel" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Demand" ADD COLUMN "externalReference" TEXT;
CREATE UNIQUE INDEX "Demand_originChannel_externalReference_key" ON "Demand"("originChannel", "externalReference");
ALTER TABLE "LegacyImportBatch" ADD COLUMN "fileName" TEXT,
 ADD COLUMN "fileBytes" BIGINT, ADD COLUMN "fileHash" TEXT,
 ADD COLUMN "stagingPhase" TEXT NOT NULL DEFAULT 'RESTORE';
CREATE TABLE "LegacyImportTableStatus" (
 "id" TEXT NOT NULL, "batchId" TEXT NOT NULL, "sourceTable" TEXT NOT NULL,
 "targetEntity" TEXT, "recordCount" INTEGER NOT NULL DEFAULT 0,
 "writtenCount" INTEGER NOT NULL DEFAULT 0, "skippedCount" INTEGER NOT NULL DEFAULT 0, "failedCount" INTEGER NOT NULL DEFAULT 0,
 "status" TEXT NOT NULL DEFAULT 'PENDING', "reasonCode" TEXT, "reason" TEXT,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "LegacyImportTableStatus_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LegacyImportRecordResult" (
 "id" TEXT NOT NULL, "batchId" TEXT NOT NULL, "sourceTable" TEXT NOT NULL,
 "sourceKey" TEXT NOT NULL, "targetEntity" TEXT NOT NULL, "targetId" TEXT,
 "status" TEXT NOT NULL, "reasonCode" TEXT, "explanation" TEXT,
 "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LegacyImportRecordResult_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LegacyImportTableStatus_batchId_sourceTable_key" ON "LegacyImportTableStatus"("batchId", "sourceTable");
CREATE INDEX "LegacyImportTableStatus_batchId_status_idx" ON "LegacyImportTableStatus"("batchId", "status");
CREATE UNIQUE INDEX "LegacyImportRecordResult_batchId_sourceTable_sourceKey_key" ON "LegacyImportRecordResult"("batchId", "sourceTable", "sourceKey");
CREATE INDEX "LegacyImportRecordResult_batchId_status_idx" ON "LegacyImportRecordResult"("batchId", "status");
ALTER TABLE "LegacyImportTableStatus" ADD CONSTRAINT "LegacyImportTableStatus_batchId_fkey"
 FOREIGN KEY ("batchId") REFERENCES "LegacyImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegacyImportRecordResult" ADD CONSTRAINT "LegacyImportRecordResult_batchId_fkey"
 FOREIGN KEY ("batchId") REFERENCES "LegacyImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep each imported source snapshot independent, even when original primary keys repeat.
DROP INDEX IF EXISTS "LegacyRawRow_sourceTable_sourceKey_key";
CREATE UNIQUE INDEX "LegacyRawRow_batchId_sourceTable_sourceKey_key" ON "LegacyRawRow"("batchId", "sourceTable", "sourceKey");

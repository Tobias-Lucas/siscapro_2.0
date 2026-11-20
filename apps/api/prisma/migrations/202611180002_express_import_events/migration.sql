-- Metadados aditivos para a importacao expressa e o historico de processamento.
ALTER TABLE "LegacyImportBatch"
  ADD COLUMN "importScope" TEXT NOT NULL DEFAULT 'FULL',
  ADD COLUMN "restoreScannedBytes" BIGINT NOT NULL DEFAULT 0;

CREATE TABLE "LegacyImportEvent" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "phase" TEXT NOT NULL,
  "level" TEXT NOT NULL DEFAULT 'INFO',
  "sourceTable" TEXT,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegacyImportEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LegacyImportEvent_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "LegacyImportBatch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LegacyImportEvent_batchId_createdAt_idx"
  ON "LegacyImportEvent"("batchId", "createdAt");

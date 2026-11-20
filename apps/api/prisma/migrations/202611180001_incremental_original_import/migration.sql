-- Additive checkpoints only. Existing users, operational data and staging are retained.
ALTER TABLE "LegacyImportBatch"
  ADD COLUMN "importControl" TEXT NOT NULL DEFAULT 'RUN',
  ADD COLUMN "importHeartbeat" TIMESTAMP(3),
  ADD COLUMN "importWorkerToken" TEXT,
  ADD COLUMN "currentImportTable" TEXT,
  ADD COLUMN "restoreTotalBytes" BIGINT,
  ADD COLUMN "restoreProcessedBytes" BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN "completedImportChunks" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "LegacyImportChunkCheckpoint" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "phase" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "sourceTable" TEXT NOT NULL,
  "startOffset" BIGINT,
  "endOffset" BIGINT,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "statementCount" INTEGER NOT NULL DEFAULT 0,
  "checksum" TEXT,
  "cursor" TEXT,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "reasonCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegacyImportChunkCheckpoint_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LegacyImportChunkCheckpoint_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LegacyImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LegacyImportChunkCheckpoint_batchId_phase_sequence_key" ON "LegacyImportChunkCheckpoint"("batchId","phase","sequence");
CREATE INDEX "LegacyImportChunk_batch_phase_table_status_idx" ON "LegacyImportChunkCheckpoint"("batchId","phase","sourceTable","status");

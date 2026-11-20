-- V3: additive changes only. Preserves all current users, records, volumes and audit logs.
ALTER TABLE "User" ADD COLUMN "accessMode" TEXT NOT NULL DEFAULT 'LEGACY';
ALTER TABLE "User" ADD COLUMN "accessTemplateId" TEXT;
CREATE TABLE "AccessTemplate" (
 "id" TEXT PRIMARY KEY, "code" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL,
 "description" TEXT, "active" BOOLEAN NOT NULL DEFAULT true, "version" INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "AccessGrant" (
 "id" TEXT PRIMARY KEY, "templateId" TEXT NOT NULL, "code" TEXT NOT NULL,
 "scope" TEXT NOT NULL DEFAULT 'GLOBAL', "allowedFields" JSONB,
 CONSTRAINT "AccessGrant_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AccessTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AccessGrant_templateId_code_key" ON "AccessGrant"("templateId","code");
CREATE INDEX "AccessGrant_code_idx" ON "AccessGrant"("code");
CREATE TABLE "AccessOverride" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "code" TEXT NOT NULL,
 "allowed" BOOLEAN NOT NULL, "scope" TEXT NOT NULL DEFAULT 'GLOBAL', "allowedFields" JSONB,
 CONSTRAINT "AccessOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AccessOverride_userId_code_key" ON "AccessOverride"("userId","code");
CREATE INDEX "AccessOverride_code_idx" ON "AccessOverride"("code");
CREATE INDEX "User_accessTemplateId_idx" ON "User"("accessTemplateId");
ALTER TABLE "User" ADD CONSTRAINT "User_accessTemplateId_fkey" FOREIGN KEY ("accessTemplateId") REFERENCES "AccessTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "ClassGroupCourse" (
 "id" TEXT PRIMARY KEY, "classGroupId" TEXT NOT NULL, "courseId" TEXT NOT NULL,
 "evidence" TEXT NOT NULL DEFAULT 'LEGACY_ENROLLMENT',
 CONSTRAINT "ClassGroupCourse_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "ClassGroupCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ClassGroupCourse_classGroupId_courseId_key" ON "ClassGroupCourse"("classGroupId","courseId");
CREATE INDEX "ClassGroupCourse_courseId_idx" ON "ClassGroupCourse"("courseId");
CREATE TABLE "LegacyImportBatch" (
 "id" TEXT PRIMARY KEY, "source" TEXT NOT NULL DEFAULT 'SISCAPRO_ANON',
 "status" TEXT NOT NULL DEFAULT 'RUNNING', "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "finishedAt" TIMESTAMP(3), "rowCount" INTEGER NOT NULL DEFAULT 0, "message" TEXT
);
CREATE TABLE "LegacyRawRow" (
 "id" TEXT PRIMARY KEY, "sourceTable" TEXT NOT NULL, "sourceKey" TEXT NOT NULL,
 "identityMethod" TEXT NOT NULL, "rowData" JSONB NOT NULL, "contentHash" TEXT NOT NULL,
 "batchId" TEXT NOT NULL, "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LegacyRawRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LegacyImportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LegacyRawRow_sourceTable_sourceKey_key" ON "LegacyRawRow"("sourceTable","sourceKey");
CREATE INDEX "LegacyRawRow_batchId_sourceTable_idx" ON "LegacyRawRow"("batchId","sourceTable");
CREATE TABLE "LegacyImportIssue" (
 "id" TEXT PRIMARY KEY, "ruleCode" TEXT NOT NULL, "sourceTable" TEXT NOT NULL,
 "sourceKey" TEXT NOT NULL, "targetTable" TEXT NOT NULL, "targetKey" TEXT,
 "status" TEXT NOT NULL DEFAULT 'OPEN', "observation" TEXT,
 "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "resolvedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "LegacyImportIssue_ruleCode_sourceTable_sourceKey_key" ON "LegacyImportIssue"("ruleCode","sourceTable","sourceKey");
CREATE INDEX "LegacyImportIssue_status_ruleCode_idx" ON "LegacyImportIssue"("status","ruleCode");

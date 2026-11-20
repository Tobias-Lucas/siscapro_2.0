-- Additive migration: demand/task workflow and immutable permission-template revisions.
-- Existing user/template grants are snapshotted at their current version.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessTemplateVersion" INTEGER;
UPDATE "User" u SET "accessTemplateVersion" = t."version" FROM "AccessTemplate" t WHERE u."accessTemplateId" = t."id" AND u."accessTemplateVersion" IS NULL;

CREATE TABLE "AccessTemplateRevision" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "createdById" TEXT,
  "changeNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessTemplateRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AccessTemplateRevision_templateId_version_key" ON "AccessTemplateRevision"("templateId", "version");
CREATE INDEX "AccessTemplateRevision_templateId_createdAt_idx" ON "AccessTemplateRevision"("templateId", "createdAt");
ALTER TABLE "AccessTemplateRevision" ADD CONSTRAINT "AccessTemplateRevision_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AccessTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AccessTemplateRevisionGrant" (
  "id" TEXT NOT NULL,
  "revisionId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
  "allowedFields" JSONB,
  CONSTRAINT "AccessTemplateRevisionGrant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AccessTemplateRevisionGrant_revisionId_code_key" ON "AccessTemplateRevisionGrant"("revisionId", "code");
CREATE INDEX "AccessTemplateRevisionGrant_code_idx" ON "AccessTemplateRevisionGrant"("code");
ALTER TABLE "AccessTemplateRevisionGrant" ADD CONSTRAINT "AccessTemplateRevisionGrant_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "AccessTemplateRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AccessTemplateRevision" ("id", "templateId", "version", "createdAt")
SELECT 'rev_' || md5(t."id" || ':' || t."version"::text), t."id", t."version", CURRENT_TIMESTAMP
FROM "AccessTemplate" t
ON CONFLICT ("templateId", "version") DO NOTHING;
INSERT INTO "AccessTemplateRevisionGrant" ("id", "revisionId", "code", "scope", "allowedFields")
SELECT 'rvg_' || md5(r."id" || ':' || g."code"), r."id", g."code", g."scope", g."allowedFields"
FROM "AccessGrant" g JOIN "AccessTemplateRevision" r ON r."templateId" = g."templateId"
ON CONFLICT ("revisionId", "code") DO NOTHING;

CREATE TABLE "DemandType" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "legacyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DemandType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DemandType_code_key" ON "DemandType"("code");
CREATE UNIQUE INDEX "DemandType_legacyId_key" ON "DemandType"("legacyId");

CREATE TABLE "Demand" (
  "id" TEXT NOT NULL,
  "legacyId" TEXT,
  "legacyStatusRaw" TEXT,
  "title" TEXT,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "receivedAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT,
  "companyId" TEXT,
  "typeId" TEXT,
  "unitId" TEXT,
  "departmentId" TEXT,
  "assignedUserId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Demand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Demand_legacyId_key" ON "Demand"("legacyId");
CREATE INDEX "Demand_status_receivedAt_idx" ON "Demand"("status", "receivedAt");
CREATE INDEX "Demand_companyId_status_idx" ON "Demand"("companyId", "status");
CREATE INDEX "Demand_assignedUserId_status_idx" ON "Demand"("assignedUserId", "status");
CREATE INDEX "Demand_unitId_departmentId_idx" ON "Demand"("unitId", "departmentId");
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "DemandType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "DemandTask" (
  "id" TEXT NOT NULL,
  "legacyId" TEXT,
  "legacyStatusRaw" TEXT,
  "demandId" TEXT NOT NULL,
  "personId" TEXT,
  "assignedUserId" TEXT,
  "createdById" TEXT,
  "title" TEXT,
  "description" TEXT,
  "dueAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DemandTask_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DemandTask_legacyId_key" ON "DemandTask"("legacyId");
CREATE INDEX "DemandTask_demandId_status_idx" ON "DemandTask"("demandId", "status");
CREATE INDEX "DemandTask_assignedUserId_status_idx" ON "DemandTask"("assignedUserId", "status");
CREATE INDEX "DemandTask_personId_idx" ON "DemandTask"("personId");
ALTER TABLE "DemandTask" ADD CONSTRAINT "DemandTask_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemandTask" ADD CONSTRAINT "DemandTask_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DemandTask" ADD CONSTRAINT "DemandTask_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DemandTask" ADD CONSTRAINT "DemandTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

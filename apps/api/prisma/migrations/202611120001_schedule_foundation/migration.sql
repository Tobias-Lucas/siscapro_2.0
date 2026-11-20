-- Additive foundation for future semester and weekly timetable planning.
-- Existing legacy-compatible free-text room fields are retained.

CREATE TABLE "Classroom" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unitId" TEXT,
  "floor" TEXT,
  "capacity" INTEGER,
  "roomType" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Classroom_unitId_code_key" ON "Classroom"("unitId", "code");
CREATE INDEX "Classroom_unitId_idx" ON "Classroom"("unitId");
CREATE INDEX "Classroom_status_idx" ON "Classroom"("status");
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TeacherAvailability" (
  "id" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "shift" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "availabilityType" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherAvailability_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TeacherAvailability_teacherId_weekday_shift_idx" ON "TeacherAvailability"("teacherId", "weekday", "shift");
CREATE INDEX "TeacherAvailability_effectiveFrom_effectiveTo_idx" ON "TeacherAvailability"("effectiveFrom", "effectiveTo");
ALTER TABLE "TeacherAvailability" ADD CONSTRAINT "TeacherAvailability_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ScheduleTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "unitId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdById" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScheduleTemplate_unitId_periodStart_periodEnd_idx" ON "ScheduleTemplate"("unitId", "periodStart", "periodEnd");
CREATE INDEX "ScheduleTemplate_status_idx" ON "ScheduleTemplate"("status");
ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ScheduleRule" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "classGroupId" TEXT NOT NULL,
  "curriculumModuleId" TEXT,
  "disciplineId" TEXT,
  "teacherId" TEXT,
  "classroomId" TEXT,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "weekPattern" TEXT NOT NULL DEFAULT 'EVERY_WEEK',
  "weekNumbers" JSONB,
  "partCode" TEXT,
  "activityLabel" TEXT,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScheduleRule_templateId_weekday_startTime_idx" ON "ScheduleRule"("templateId", "weekday", "startTime");
CREATE INDEX "ScheduleRule_classGroupId_idx" ON "ScheduleRule"("classGroupId");
CREATE INDEX "ScheduleRule_teacherId_weekday_idx" ON "ScheduleRule"("teacherId", "weekday");
CREATE INDEX "ScheduleRule_classroomId_weekday_idx" ON "ScheduleRule"("classroomId", "weekday");
CREATE INDEX "ScheduleRule_curriculumModuleId_idx" ON "ScheduleRule"("curriculumModuleId");
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScheduleTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_curriculumModuleId_fkey" FOREIGN KEY ("curriculumModuleId") REFERENCES "CurriculumModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ScheduleGenerationRun" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "requestedById" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "plannedLessons" INTEGER NOT NULL DEFAULT 0,
  "conflictCount" INTEGER NOT NULL DEFAULT 0,
  "summary" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleGenerationRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScheduleGenerationRun_templateId_createdAt_idx" ON "ScheduleGenerationRun"("templateId", "createdAt");
CREATE INDEX "ScheduleGenerationRun_status_idx" ON "ScheduleGenerationRun"("status");
ALTER TABLE "ScheduleGenerationRun" ADD CONSTRAINT "ScheduleGenerationRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScheduleTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleGenerationRun" ADD CONSTRAINT "ScheduleGenerationRun_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClassGroup" ADD COLUMN "classroomId" TEXT;
CREATE INDEX "ClassGroup_classroomId_idx" ON "ClassGroup"("classroomId");
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AcademicLesson" ADD COLUMN "classroomId" TEXT;
ALTER TABLE "AcademicLesson" ADD COLUMN "curriculumModuleId" TEXT;
ALTER TABLE "AcademicLesson" ADD COLUMN "scheduleRuleId" TEXT;
ALTER TABLE "AcademicLesson" ADD COLUMN "generationRunId" TEXT;
CREATE INDEX "AcademicLesson_classroomId_lessonDate_idx" ON "AcademicLesson"("classroomId", "lessonDate");
CREATE INDEX "AcademicLesson_curriculumModuleId_idx" ON "AcademicLesson"("curriculumModuleId");
CREATE INDEX "AcademicLesson_scheduleRuleId_idx" ON "AcademicLesson"("scheduleRuleId");
CREATE INDEX "AcademicLesson_generationRunId_idx" ON "AcademicLesson"("generationRunId");
ALTER TABLE "AcademicLesson" ADD CONSTRAINT "AcademicLesson_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AcademicLesson" ADD CONSTRAINT "AcademicLesson_curriculumModuleId_fkey" FOREIGN KEY ("curriculumModuleId") REFERENCES "CurriculumModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AcademicLesson" ADD CONSTRAINT "AcademicLesson_scheduleRuleId_fkey" FOREIGN KEY ("scheduleRuleId") REFERENCES "ScheduleRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AcademicLesson" ADD CONSTRAINT "AcademicLesson_generationRunId_fkey" FOREIGN KEY ("generationRunId") REFERENCES "ScheduleGenerationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ScheduleConflict" (
  "id" TEXT NOT NULL,
  "generationRunId" TEXT NOT NULL,
  "scheduleRuleId" TEXT,
  "academicLessonId" TEXT,
  "conflictType" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'WARNING',
  "description" TEXT NOT NULL,
  "resolutionStatus" TEXT NOT NULL DEFAULT 'OPEN',
  "resolutionNote" TEXT,
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleConflict_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScheduleConflict_generationRunId_resolutionStatus_idx" ON "ScheduleConflict"("generationRunId", "resolutionStatus");
CREATE INDEX "ScheduleConflict_scheduleRuleId_idx" ON "ScheduleConflict"("scheduleRuleId");
CREATE INDEX "ScheduleConflict_academicLessonId_idx" ON "ScheduleConflict"("academicLessonId");
ALTER TABLE "ScheduleConflict" ADD CONSTRAINT "ScheduleConflict_generationRunId_fkey" FOREIGN KEY ("generationRunId") REFERENCES "ScheduleGenerationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleConflict" ADD CONSTRAINT "ScheduleConflict_scheduleRuleId_fkey" FOREIGN KEY ("scheduleRuleId") REFERENCES "ScheduleRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleConflict" ADD CONSTRAINT "ScheduleConflict_academicLessonId_fkey" FOREIGN KEY ("academicLessonId") REFERENCES "AcademicLesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleConflict" ADD CONSTRAINT "ScheduleConflict_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CurriculumMatrix" ADD COLUMN "durationMonths" INTEGER;
ALTER TABLE "CurriculumMatrix" ADD COLUMN "totalWorkload" INTEGER;

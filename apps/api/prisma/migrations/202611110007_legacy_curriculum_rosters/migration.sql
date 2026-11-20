-- Incremental migration: source-verified SISCAPRO academic relationships.
ALTER TABLE "Course"
  ADD COLUMN "theoryWorkloadRaw" TEXT,
  ADD COLUMN "practiceWorkloadRaw" TEXT,
  ADD COLUMN "authorizationProtocol" TEXT,
  ADD COLUMN "legacySegmentCode" TEXT,
  ADD COLUMN "legacyUnitCode" TEXT;
ALTER TABLE "ClassGroup"
  ADD COLUMN "legacySegmentCode" TEXT,
  ADD COLUMN "legacyProfileCode" TEXT;
ALTER TABLE "Enrollment"
  ADD COLUMN "legacyContractReference" TEXT,
  ADD COLUMN "rosterStartDate" TIMESTAMP(3),
  ADD COLUMN "rosterEndDate" TIMESTAMP(3),
  ADD COLUMN "returnDay" TEXT;
ALTER TABLE "Attendance"
  ADD COLUMN "legacyCode" TEXT,
  ADD COLUMN "legacyDateReference" TEXT;

CREATE TABLE "Discipline" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT,
  "teacherId" TEXT,
  "legacyProfessorReference" TEXT,
  "name" TEXT NOT NULL,
  "phaseCode" TEXT,
  "moduleLabel" TEXT,
  "workloadRaw" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "statusRaw" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Discipline_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Discipline_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Discipline_courseId_phaseCode_idx" ON "Discipline"("courseId", "phaseCode");

CREATE TABLE "DisciplineTeacher" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "disciplineId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DisciplineTeacher_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DisciplineTeacher_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "DisciplineTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DisciplineTeacher_courseId_disciplineId_teacherId_key" ON "DisciplineTeacher"("courseId","disciplineId","teacherId");
CREATE INDEX "DisciplineTeacher_teacherId_idx" ON "DisciplineTeacher"("teacherId");

CREATE TABLE "CourseHours" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "shift" TEXT NOT NULL,
  "daysComboRaw" TEXT,
  "courseComboRaw" TEXT,
  "startTime2" TEXT,
  "endTime2" TEXT,
  "shift2" TEXT,
  "daysCombo2Raw" TEXT,
  "courseCombo2Raw" TEXT,
  "unitRaw" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseHours_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CourseHours_courseId_idx" ON "CourseHours"("courseId");

CREATE TABLE "CourseTeachingDays" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "hoursId" TEXT NOT NULL,
  "monday" BOOLEAN NOT NULL DEFAULT FALSE,
  "tuesday" BOOLEAN NOT NULL DEFAULT FALSE,
  "wednesday" BOOLEAN NOT NULL DEFAULT FALSE,
  "thursday" BOOLEAN NOT NULL DEFAULT FALSE,
  "friday" BOOLEAN NOT NULL DEFAULT FALSE,
  "saturday" BOOLEAN NOT NULL DEFAULT FALSE,
  "partCode" TEXT,
  "unitRaw" TEXT,
  CONSTRAINT "CourseTeachingDays_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CourseTeachingDays_hoursId_fkey" FOREIGN KEY ("hoursId") REFERENCES "CourseHours"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CourseTeachingDays_courseId_idx" ON "CourseTeachingDays"("courseId");

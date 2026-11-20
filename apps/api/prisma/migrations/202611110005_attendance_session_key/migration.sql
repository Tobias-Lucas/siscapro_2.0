-- A legacy class may have more than one session per group and calendar day.
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "sessionKey" TEXT NOT NULL DEFAULT 'turn';
ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_personId_classGroupId_classDate_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_personId_classGroupId_classDate_sessionKey_key" ON "Attendance"("personId","classGroupId","classDate","sessionKey");

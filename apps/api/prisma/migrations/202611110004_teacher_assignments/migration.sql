CREATE TABLE "TeacherAssignment" (
 "id" TEXT PRIMARY KEY,
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
 "classGroupId" TEXT NOT NULL REFERENCES "ClassGroup"("id") ON DELETE RESTRICT,
 "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "TeacherAssignment_userId_classGroupId_key" ON "TeacherAssignment"("userId","classGroupId");
CREATE INDEX "TeacherAssignment_classGroupId_idx" ON "TeacherAssignment"("classGroupId");

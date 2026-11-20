-- SISCAPRO V2.0 / E1 modernized normalized domains
-- These tables are created separately from legacy MariaDB. No original tables are altered.

CREATE TABLE "Unit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "city" TEXT,
  "state" TEXT,
  "address" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE "Department" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE "UserUnit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "departmentId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE "UserUnit" ADD CONSTRAINT "UserUnit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "UserUnit_userId_idx" ON "UserUnit"("userId");

ALTER TABLE "UserUnit" ADD CONSTRAINT "UserUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "UserUnit_unitId_idx" ON "UserUnit"("unitId");

ALTER TABLE "UserUnit" ADD CONSTRAINT "UserUnit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "UserUnit_departmentId_idx" ON "UserUnit"("departmentId");

CREATE UNIQUE INDEX "UserUnit_userId_unitId_key" ON "UserUnit"("userId", "unitId");

CREATE TABLE "ReferenceItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "domain" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX "ReferenceItem_domain_code_key" ON "ReferenceItem"("domain", "code");

CREATE TABLE "CompanyGroup" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE "CompanyGroupMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "groupId" TEXT NOT NULL,
  "companyId" TEXT NOT NULL
);

ALTER TABLE "CompanyGroupMember" ADD CONSTRAINT "CompanyGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CompanyGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "CompanyGroupMember_groupId_idx" ON "CompanyGroupMember"("groupId");

ALTER TABLE "CompanyGroupMember" ADD CONSTRAINT "CompanyGroupMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "CompanyGroupMember_companyId_idx" ON "CompanyGroupMember"("companyId");

CREATE UNIQUE INDEX "CompanyGroupMember_groupId_companyId_key" ON "CompanyGroupMember"("groupId", "companyId");

CREATE TABLE "CompanyContact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "category" TEXT NOT NULL,
  "position" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "CompanyContact_companyId_idx" ON "CompanyContact"("companyId");

CREATE TABLE "CurriculumMatrix" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

ALTER TABLE "CurriculumMatrix" ADD CONSTRAINT "CurriculumMatrix_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "CurriculumMatrix_courseId_idx" ON "CurriculumMatrix"("courseId");

CREATE TABLE "CurriculumModule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matrixId" TEXT NOT NULL,
  "disciplineId" TEXT,
  "title" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "plannedHours" INTEGER,
  "lessonCount" INTEGER,
  "mandatory" BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE "CurriculumModule" ADD CONSTRAINT "CurriculumModule_matrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "CurriculumMatrix"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "CurriculumModule_matrixId_idx" ON "CurriculumModule"("matrixId");

ALTER TABLE "CurriculumModule" ADD CONSTRAINT "CurriculumModule_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CurriculumModule_disciplineId_idx" ON "CurriculumModule"("disciplineId");

CREATE TABLE "AcademicLesson" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "classGroupId" TEXT NOT NULL,
  "disciplineId" TEXT,
  "teacherId" TEXT,
  "title" TEXT NOT NULL,
  "lessonDate" TIMESTAMP(3) NOT NULL,
  "shift" TEXT NOT NULL,
  "room" TEXT,
  "state" TEXT NOT NULL DEFAULT 'PLANNED',
  "executedAt" TIMESTAMP(3)
);

ALTER TABLE "AcademicLesson" ADD CONSTRAINT "AcademicLesson_classGroupId_fkey" FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "AcademicLesson_classGroupId_idx" ON "AcademicLesson"("classGroupId");

ALTER TABLE "AcademicLesson" ADD CONSTRAINT "AcademicLesson_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AcademicLesson_disciplineId_idx" ON "AcademicLesson"("disciplineId");

ALTER TABLE "AcademicLesson" ADD CONSTRAINT "AcademicLesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AcademicLesson_teacherId_idx" ON "AcademicLesson"("teacherId");

CREATE TABLE "Holiday" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "unitId" TEXT,
  "holidayDate" TIMESTAMP(3) NOT NULL,
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'INSTITUTIONAL'
);

ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Holiday_unitId_idx" ON "Holiday"("unitId");

CREATE TABLE "LearningMaterial" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "disciplineId" TEXT,
  "documentId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "LearningMaterial_courseId_idx" ON "LearningMaterial"("courseId");

ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "LearningMaterial_disciplineId_idx" ON "LearningMaterial"("disciplineId");

ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "LearningMaterial_documentId_idx" ON "LearningMaterial"("documentId");

CREATE TABLE "MaterialRelease" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "materialId" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "MaterialRelease" ADD CONSTRAINT "MaterialRelease_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LearningMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "MaterialRelease_materialId_idx" ON "MaterialRelease"("materialId");

ALTER TABLE "MaterialRelease" ADD CONSTRAINT "MaterialRelease_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "MaterialRelease_personId_idx" ON "MaterialRelease"("personId");

CREATE UNIQUE INDEX "MaterialRelease_materialId_personId_key" ON "MaterialRelease"("materialId", "personId");

CREATE TABLE "AbsenceJustification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "personId" TEXT NOT NULL,
  "attendanceId" TEXT,
  "documentId" TEXT,
  "reason" TEXT NOT NULL,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
  "reviewNotes" TEXT
);

ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "AbsenceJustification_personId_idx" ON "AbsenceJustification"("personId");

ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AbsenceJustification_attendanceId_idx" ON "AbsenceJustification"("attendanceId");

ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AbsenceJustification_documentId_idx" ON "AbsenceJustification"("documentId");

CREATE TABLE "BusinessContract" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "modality" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "amount" DECIMAL(12,2),
  "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT
);

ALTER TABLE "BusinessContract" ADD CONSTRAINT "BusinessContract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "BusinessContract_companyId_idx" ON "BusinessContract"("companyId");

CREATE TABLE "ContractAmendment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "documentId" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN'
);

ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ContractAmendment_contractId_idx" ON "ContractAmendment"("contractId");

ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ContractAmendment_documentId_idx" ON "ContractAmendment"("documentId");

CREATE TABLE "ContractMovement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contractId" TEXT NOT NULL,
  "actorId" TEXT,
  "kind" TEXT NOT NULL,
  "previousState" TEXT,
  "newState" TEXT,
  "effectiveAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT
);

ALTER TABLE "ContractMovement" ADD CONSTRAINT "ContractMovement_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ContractMovement_contractId_idx" ON "ContractMovement"("contractId");

ALTER TABLE "ContractMovement" ADD CONSTRAINT "ContractMovement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ContractMovement_actorId_idx" ON "ContractMovement"("actorId");

CREATE TABLE "Institution" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "cnpj" TEXT,
  "city" TEXT,
  "state" TEXT,
  "contactEmail" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE "InstitutionCourse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "institutionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "level" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

ALTER TABLE "InstitutionCourse" ADD CONSTRAINT "InstitutionCourse_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "InstitutionCourse_institutionId_idx" ON "InstitutionCourse"("institutionId");

CREATE TABLE "InternshipSupervisor" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "userId" TEXT,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

ALTER TABLE "InternshipSupervisor" ADD CONSTRAINT "InternshipSupervisor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "InternshipSupervisor_companyId_idx" ON "InternshipSupervisor"("companyId");

ALTER TABLE "InternshipSupervisor" ADD CONSTRAINT "InternshipSupervisor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "InternshipSupervisor_userId_idx" ON "InternshipSupervisor"("userId");

CREATE TABLE "InternshipReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "internshipId" TEXT NOT NULL,
  "supervisorId" TEXT,
  "kind" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "content" TEXT NOT NULL,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN'
);

ALTER TABLE "InternshipReport" ADD CONSTRAINT "InternshipReport_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "InternshipReport_internshipId_idx" ON "InternshipReport"("internshipId");

ALTER TABLE "InternshipReport" ADD CONSTRAINT "InternshipReport_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "InternshipSupervisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "InternshipReport_supervisorId_idx" ON "InternshipReport"("supervisorId");

CREATE TABLE "InternshipLeave" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "internshipId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN'
);

ALTER TABLE "InternshipLeave" ADD CONSTRAINT "InternshipLeave_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "InternshipLeave_internshipId_idx" ON "InternshipLeave"("internshipId");

CREATE TABLE "FinanceAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "bankName" TEXT,
  "agency" TEXT,
  "accountNumber" TEXT,
  "pixKey" TEXT,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE "FinanceCategory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE "FinanceMovement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "categoryId" TEXT,
  "direction" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "externalReference" TEXT
);

ALTER TABLE "FinanceMovement" ADD CONSTRAINT "FinanceMovement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinanceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "FinanceMovement_accountId_idx" ON "FinanceMovement"("accountId");

ALTER TABLE "FinanceMovement" ADD CONSTRAINT "FinanceMovement_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "FinanceMovement_categoryId_idx" ON "FinanceMovement"("categoryId");

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT,
  "reference" TEXT NOT NULL UNIQUE,
  "competence" TEXT,
  "dueDate" TIMESTAMP(3),
  "issuedAt" TIMESTAMP(3),
  "amount" DECIMAL(12,2) NOT NULL,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN'
);

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Invoice_companyId_idx" ON "Invoice"("companyId");

CREATE TABLE "InvoiceLine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL
);

ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

CREATE TABLE "BillingAttachment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "titleId" TEXT,
  "invoiceId" TEXT,
  "documentId" TEXT NOT NULL,
  "kind" TEXT NOT NULL
);

ALTER TABLE "BillingAttachment" ADD CONSTRAINT "BillingAttachment_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "FinancialTitle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "BillingAttachment_titleId_idx" ON "BillingAttachment"("titleId");

ALTER TABLE "BillingAttachment" ADD CONSTRAINT "BillingAttachment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "BillingAttachment_invoiceId_idx" ON "BillingAttachment"("invoiceId");

ALTER TABLE "BillingAttachment" ADD CONSTRAINT "BillingAttachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "BillingAttachment_documentId_idx" ON "BillingAttachment"("documentId");

CREATE TABLE "ServiceInteraction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN'
);

ALTER TABLE "ServiceInteraction" ADD CONSTRAINT "ServiceInteraction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ServiceInteraction_requestId_idx" ON "ServiceInteraction"("requestId");

ALTER TABLE "ServiceInteraction" ADD CONSTRAINT "ServiceInteraction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ServiceInteraction_authorId_idx" ON "ServiceInteraction"("authorId");

CREATE TABLE "SocialVisit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "personId" TEXT,
  "companyId" TEXT,
  "authorId" TEXT NOT NULL,
  "visitDate" TIMESTAMP(3) NOT NULL,
  "summary" TEXT NOT NULL,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN'
);

ALTER TABLE "SocialVisit" ADD CONSTRAINT "SocialVisit_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "SocialVisit_personId_idx" ON "SocialVisit"("personId");

ALTER TABLE "SocialVisit" ADD CONSTRAINT "SocialVisit_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "SocialVisit_companyId_idx" ON "SocialVisit"("companyId");

ALTER TABLE "SocialVisit" ADD CONSTRAINT "SocialVisit_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "SocialVisit_authorId_idx" ON "SocialVisit"("authorId");

CREATE TABLE "SelectionProcess" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "code" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
  "description" TEXT
);

CREATE TABLE "SelectionEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "processId" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "score" DECIMAL(10,2),
  "rank" INTEGER,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN'
);

ALTER TABLE "SelectionEntry" ADD CONSTRAINT "SelectionEntry_processId_fkey" FOREIGN KEY ("processId") REFERENCES "SelectionProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "SelectionEntry_processId_idx" ON "SelectionEntry"("processId");

ALTER TABLE "SelectionEntry" ADD CONSTRAINT "SelectionEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "SelectionEntry_personId_idx" ON "SelectionEntry"("personId");

CREATE UNIQUE INDEX "SelectionEntry_processId_personId_key" ON "SelectionEntry"("processId", "personId");

CREATE TABLE "PortalMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recipientId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "channel" TEXT NOT NULL DEFAULT 'IN_APP'
);

ALTER TABLE "PortalMessage" ADD CONSTRAINT "PortalMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "PortalMessage_recipientId_idx" ON "PortalMessage"("recipientId");

CREATE TABLE "DocumentTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "templateText" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE "DocumentReview" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
  "note" TEXT,
  "reviewedAt" TIMESTAMP(3)
);

ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "DocumentReview_documentId_idx" ON "DocumentReview"("documentId");

ALTER TABLE "DocumentReview" ADD CONSTRAINT "DocumentReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "DocumentReview_reviewerId_idx" ON "DocumentReview"("reviewerId");

CREATE TABLE "LegacySyncIssue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sourceTable" TEXT NOT NULL,
  "legacyRecordId" TEXT NOT NULL,
  "errorCode" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "status" "RequestStatus" NOT NULL DEFAULT 'OPEN'
);

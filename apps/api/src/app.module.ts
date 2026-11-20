import { Module } from '@nestjs/common';
import { IamModule } from './iam/iam.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';
import { StagingModule } from './staging/staging.module.js';
import { OperationsModule } from './operations/operations.module.js';
import { PrismaModule } from './common/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { PeopleModule } from './people/people.module.js';
import { CompaniesModule } from './companies/companies.module.js';
import { AcademicModule } from './academic/academic.module.js';
import { ContractsModule } from './contracts/contracts.module.js';
import { InternshipsModule } from './internships/internships.module.js';
import { RecruitmentModule } from './recruitment/recruitment.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { ServiceModule } from './service/service.module.js';
import { DocumentsModule } from './documents/documents.module.js';
import { UsersModule } from './users/users.module.js';
import { LegacyModule } from './legacy/legacy.module.js';
import { HealthController } from './health.controller.js';
import { PortalModule } from './portal/portal.module.js';
import { DossiersModule } from './dossiers/dossiers.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { DemandsModule } from './demands/demands.module.js';

@Module({
  imports: [WorkspacesModule, PrismaModule, IamModule, StagingModule, AuthModule, DashboardModule, PeopleModule, CompaniesModule, AcademicModule, ContractsModule, InternshipsModule, RecruitmentModule, FinanceModule, ServiceModule, DocumentsModule, UsersModule, LegacyModule, PortalModule, OperationsModule, DossiersModule, ReportsModule, DemandsModule],
  controllers: [HealthController],
})
export class AppModule {}

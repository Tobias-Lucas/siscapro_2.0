import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { AuditService } from './audit.service.js';
import { AuthGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { InitialAdminService } from './initial-admin.service.js';
import { DemoSeedService } from './demo-seed.service.js';
import { AccessService } from '../iam/access.service.js';
import { ResponseFieldsInterceptor } from '../iam/response-fields.interceptor.js';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({ providers: [PrismaService, AuditService, AuthGuard, RolesGuard, InitialAdminService, DemoSeedService, AccessService, {provide:APP_INTERCEPTOR,useClass:ResponseFieldsInterceptor}], exports: [PrismaService, AuditService, AuthGuard, RolesGuard, AccessService] })
export class PrismaModule {}

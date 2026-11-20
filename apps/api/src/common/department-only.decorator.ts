import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '../generated/prisma/client.js';
import { AuthGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { Roles } from './roles.decorator.js';

/** Only explicitly authorized departments may operate a domain. */
export const DepartmentOnly = (...departments: UserRole[]) => applyDecorators(
  UseGuards(AuthGuard, RolesGuard),
  Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, ...departments),
);

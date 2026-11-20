import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRole } from '../generated/prisma/client.js';
import { AuthGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';
import { Roles } from './roles.decorator.js';

export const INTERNAL_ROLES=[UserRole.SUPER_ADMIN,UserRole.ADMIN,UserRole.SECRETARY,UserRole.FINANCE,UserRole.TRIAGE,UserRole.CONTRACTS,UserRole.SOCIAL_SERVICE,UserRole.RECEPTION,UserRole.COMMERCIAL,UserRole.HR];
export const InternalOnly=()=>applyDecorators(UseGuards(AuthGuard,RolesGuard),Roles(...INTERNAL_ROLES));

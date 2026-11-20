import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator.js';
import { UserRole } from '../generated/prisma/client.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest().user;
    // For CUSTOM internal users, AuthGuard already enforced the granular permission.
    // Never override role isolation of external portals or privileged data migration.
    const req = context.switchToHttp().getRequest();
    if (user?.accessMode === 'CUSTOM' && !['/api/portal','/api/legacy'].some(prefix => String(req.originalUrl||'').startsWith(prefix))) {
      return !!req.accessDecision;
    }
    return user?.role === UserRole.SUPER_ADMIN || roles.includes(user?.role);
  }
}

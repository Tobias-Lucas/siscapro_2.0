import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { PrismaService } from './prisma.service.js';
import { AccessService } from '../iam/access.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const bearerHeader = String(req.headers.authorization || '');
    const bearer = bearerHeader.startsWith('Bearer ') ? bearerHeader.slice(7) : undefined;
    const token = req.cookies?.proativa_session || bearer;
    if (!token) throw new UnauthorizedException('Sessao nao encontrada');
    try {
      const secret = process.env.JWT_SECRET || '';
      if (secret.length < 48 || secret.includes('change-me')) throw new Error('JWT_SECRET inseguro');
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || typeof payload.sub !== 'string') throw new Error('Token invalido');
      // A signed JWT does not override a user deactivation or role change.
      const current = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, active: true, name: true, email: true, accessMode: true } });
      if (!current?.active) throw new Error('Conta desativada');
      req.user = { sub: current.id, role: current.role, name: current.name, email: current.email, accessMode: current.accessMode };
      // Authorization exceptions must propagate as 403, not be presented as bad credentials.
      const decision = await this.access.forRequest(req.user, req.method, req.originalUrl || req.url, req.body);
      req.accessDecision = decision;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Sessao invalida ou expirada');
    }
  }
}

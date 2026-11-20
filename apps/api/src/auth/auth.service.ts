import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { PasswordAlgorithm } from '../generated/prisma/client.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}
  async login(identifier: string, password: string, ip?: string) {
    const key = identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { active: true, OR: [{ email: key }, { login: identifier.trim() }] } });
    if (!user) throw new UnauthorizedException('Usuário ou senha inválidos');
    let valid = false;
    if (user.passwordAlgorithm === PasswordAlgorithm.ARGON2ID) valid = await argon2.verify(user.passwordHash, password);
    // Legacy MD5 credentials are intentionally not accepted. Accounts must be provisioned
    // or reset through an audited Argon2id workflow before login can be enabled.
    if (!valid) throw new UnauthorizedException('Usuário ou senha inválidos');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.log({ userId: user.id, action: 'AUTH_LOGIN', entity: 'User', entityId: user.id, ip });
    const token = jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any });
    return { token, user: this.publicUser(user) };
  }
  async me(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !user.active) throw new UnauthorizedException();
    return this.publicUser(user);
  }
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const valid = user.passwordAlgorithm === PasswordAlgorithm.ARGON2ID && await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new UnauthorizedException('Senha atual inválida');
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await argon2.hash(newPassword, { type: argon2.argon2id }), passwordAlgorithm: PasswordAlgorithm.ARGON2ID } });
    await this.audit.log({ userId: id, action: 'AUTH_PASSWORD_CHANGED', entity: 'User', entityId: id });
    return { ok: true };
  }
  private publicUser(user: any) { return { id: user.id, name: user.name, email: user.email, role: user.role }; }
}

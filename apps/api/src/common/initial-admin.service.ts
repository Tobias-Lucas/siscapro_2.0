import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordAlgorithm, UserRole } from '../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class InitialAdminService implements OnApplicationBootstrap {
  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    const email = (process.env.AITINET_ADMIN_EMAIL || 'admin@aitinet.local').trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    // Never overwrite or promote an existing account during application startup.
    if (existing) {
      console.info('[bootstrap] Conta administrativa inicial ja existe; nenhuma alteracao realizada.');
      return;
    }

    const password = process.env.AITINET_ADMIN_PASSWORD || '';
    if (
      !password ||
      password === 'ChangeThisNow!2026' ||
      password.length < 14
    ) {
      throw new Error('Defina uma senha inicial forte via scripts/setup.sh ou scripts/setup.ps1.');
    }

    // The login column is independently unique and may already be occupied by a
    // legacy/demo account. Email is accepted by AuthService, so the bootstrap
    // administrator does not need a separate login value.
    await this.prisma.user.create({
      data: {
        name: process.env.AITINET_ADMIN_NAME || 'Administrador do Sistema',
        email,
        login: null,
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        passwordAlgorithm: PasswordAlgorithm.ARGON2ID,
        role: UserRole.SUPER_ADMIN,
        active: true,
      },
    });

    console.warn(`[bootstrap] Conta administrativa inicial criada para ${email}. Entre usando o e-mail configurado.`);
  }
}

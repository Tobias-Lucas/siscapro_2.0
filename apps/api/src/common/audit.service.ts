import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  log(data: { userId?: string; action: string; entity?: string; entityId?: string; metadata?: Record<string, unknown>; ip?: string }) {
    return this.prisma.auditLog.create({ data: { ...data, metadata: data.metadata as any } });
  }
}
